import io
import os
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw
import httpx

from main import app
from services.photo_studio_service import get_photo_studio_provider, PhotoStyle
from services.stability_provider import StabilityProvider
from services.bria_provider import BriaProvider
from services.demo_studio_provider import DemoStudioProvider


def _create_dummy_image_bytes(color: str = "red") -> bytes:
    img = Image.new("RGB", (100, 100), color=color)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def test_provider_factory():
    """Verify that get_photo_studio_provider selects providers according to configuration priority."""
    # 1. Explicit PHOTO_STUDIO_PROVIDER=bria
    with patch.dict(os.environ, {"PHOTO_STUDIO_PROVIDER": "bria", "BRIA_API_TOKEN": "bria-tok-123"}, clear=False):
        p = get_photo_studio_provider()
        assert isinstance(p, BriaProvider), "Should return BriaProvider when PHOTO_STUDIO_PROVIDER=bria"

    # 2. Explicit PHOTO_STUDIO_PROVIDER=stability
    with patch.dict(os.environ, {"PHOTO_STUDIO_PROVIDER": "stability", "STABILITY_API_KEY": "sk-dummy"}, clear=False):
        p = get_photo_studio_provider()
        assert isinstance(p, StabilityProvider), "Should return StabilityProvider when PHOTO_STUDIO_PROVIDER=stability"

    # 3. Explicit PHOTO_STUDIO_PROVIDER=demo
    with patch.dict(os.environ, {"PHOTO_STUDIO_PROVIDER": "demo"}, clear=False):
        p = get_photo_studio_provider()
        assert isinstance(p, DemoStudioProvider), "Should return DemoStudioProvider when PHOTO_STUDIO_PROVIDER=demo"

    # 4. Auto-selection: BRIA_API_TOKEN present -> BriaProvider
    with patch.dict(os.environ, {"PHOTO_STUDIO_PROVIDER": "", "BRIA_API_TOKEN": "bria-tok", "STABILITY_API_KEY": ""}, clear=False):
        p = get_photo_studio_provider()
        assert isinstance(p, BriaProvider), "Should auto-select BriaProvider when BRIA_API_TOKEN is present"

    # 5. Auto-selection: Only STABILITY_API_KEY present -> StabilityProvider
    with patch.dict(os.environ, {"PHOTO_STUDIO_PROVIDER": "", "BRIA_API_TOKEN": "", "STABILITY_API_KEY": "sk-dummy"}, clear=False):
        p = get_photo_studio_provider()
        assert isinstance(p, StabilityProvider), "Should auto-select StabilityProvider when only STABILITY_API_KEY is present"

    # 6. Fallback: No keys -> DemoStudioProvider
    with patch.dict(os.environ, {"PHOTO_STUDIO_PROVIDER": "", "BRIA_API_TOKEN": "", "STABILITY_API_KEY": ""}, clear=False):
        p = get_photo_studio_provider()
        assert isinstance(p, DemoStudioProvider), "Should return DemoStudioProvider when no credentials are configured"

    print("test_provider_factory passed!")


def test_bria_request_construction():
    """Verify Bria request payload and header construction without sending network requests."""
    provider = BriaProvider(api_token="test-bria-token-12345")
    img_bytes = _create_dummy_image_bytes("purple")

    # 1. Remove background request construction
    rm_req = provider.build_remove_bg_request(img_bytes)
    assert rm_req["url"] == "https://engine.prod.bria-api.com/v2/image/edit/remove_background"
    assert rm_req["headers"]["api_token"] == "test-bria-token-12345"
    assert rm_req["payload"]["preserve_alpha"] is True
    assert rm_req["payload"]["sync"] is False
    assert len(rm_req["payload"]["image"]) > 10, "Should contain Base64 encoded image"

    # 2. Replace background request construction
    rep_req = provider.build_replace_bg_request(img_bytes, style=PhotoStyle.MARKETPLACE)
    assert rep_req["url"] == "https://engine.prod.bria-api.com/v2/image/edit/replace_background"
    assert rep_req["headers"]["api_token"] == "test-bria-token-12345"
    assert rep_req["payload"]["mode"] == "high_control"
    assert "Preserve the original product exactly" in rep_req["payload"]["prompt"]
    assert "Do not redesign" in rep_req["payload"]["prompt"]
    assert len(rep_req["payload"]["image"]) > 10

    print("test_bria_request_construction passed!")


def test_bria_live_pipeline_mocked():
    """Verify BriaProvider async orchestration, status polling, and decoding using mocked transport (0 credits)."""
    img_bytes = _create_dummy_image_bytes("orange")

    # Mock response for POST replace_background
    mock_post_resp = MagicMock()
    mock_post_resp.status_code = 200
    mock_post_resp.json.return_value = {
        "request_id": "bria-req-999",
        "status_url": "https://engine.prod.bria-api.com/v2/status/bria-req-999",
        "status": "IN_PROGRESS",
    }
    mock_post_resp.raise_for_status = MagicMock()

    # Mock response for GET status endpoint
    mock_status_resp = MagicMock()
    mock_status_resp.status_code = 200
    mock_status_resp.json.return_value = {
        "status": "COMPLETED",
        "result_url": "https://storage.bria.ai/results/bria-req-999.png",
    }
    mock_status_resp.raise_for_status = MagicMock()

    # Mock response for GET result image (transparent RGBA cutout)
    result_img_buf = io.BytesIO()
    cutout_img = Image.new("RGBA", (150, 150), (0, 0, 0, 0))
    c_draw = ImageDraw.Draw(cutout_img)
    c_draw.ellipse([20, 20, 130, 130], fill=(200, 120, 50, 255))
    cutout_img.save(result_img_buf, format="PNG")
    result_png_bytes = result_img_buf.getvalue()

    mock_img_resp = MagicMock()
    mock_img_resp.status_code = 200
    mock_img_resp.content = result_png_bytes
    mock_img_resp.raise_for_status = MagicMock()

    provider = BriaProvider(api_token="valid-token")

    async def run_bria():
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post, \
             patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get, \
             patch("asyncio.sleep", new_callable=AsyncMock):

            mock_post.return_value = mock_post_resp

            # First GET is status, second GET is image download
            mock_get.side_effect = [mock_status_resp, mock_img_resp]

            result = await provider.enhance_product(
                img_bytes, "artisan_pottery.jpg", "image/jpeg", PhotoStyle.MARKETPLACE, 0
            )

            assert result.success is True
            assert result.demo_mode is False
            assert "quality_pipeline_v2" in result.method
            assert len(result.result_image_base64) > 10
            assert "finalizing_marketplace" in result.stages_completed

            # Verify API calls
            assert mock_post.called
            post_args, post_kwargs = mock_post.call_args
            assert "cutout" in post_args[0]
            assert post_kwargs["headers"]["api_token"] == "valid-token"

            assert mock_get.call_count == 2

    import asyncio
    asyncio.run(run_bria())
    print("test_bria_live_pipeline_mocked passed!")


def test_bria_error_handling():
    """Verify Bria error handling when API returns 401 or network error."""
    provider = BriaProvider(api_token="bad-token")
    img_bytes = _create_dummy_image_bytes("teal")

    mock_err_resp = MagicMock()
    mock_err_resp.status_code = 401
    mock_err_resp.text = '{"error": {"code": 401, "message": "invalid_api_token"}}'

    http_error = httpx.HTTPStatusError(
        message="401 Unauthorized",
        request=MagicMock(),
        response=mock_err_resp
    )

    async def run_err():
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.side_effect = http_error

            result = await provider.enhance_product(
                img_bytes, "test.jpg", "image/jpeg", PhotoStyle.MARKETPLACE, 0
            )
            assert result.success is False
            assert result.demo_mode is False
            assert result.error_code == "401"
            assert "invalid or unauthorized" in result.message

    import asyncio
    asyncio.run(run_err())

    # Unconfigured provider test
    unconfigured = BriaProvider(api_token="")
    async def run_unconf():
        result = await unconfigured.enhance_product(
            img_bytes, "test.jpg", "image/jpeg", PhotoStyle.MARKETPLACE, 0
        )
        assert result.success is False
        assert result.error_code == "AUTH_ERROR"
        assert "BRIA_API_TOKEN is not configured" in result.message

    asyncio.run(run_unconf())
    print("test_bria_error_handling passed!")


def test_demo_mode():
    """Verify that explicit use_demo=True routes to DemoStudioProvider and returns demo_mode=True."""
    client = TestClient(app)
    img_bytes = _create_dummy_image_bytes("blue")

    response = client.post(
        "/api/photo-studio/enhance",
        data={"style": "marketplace", "selected_object_index": 0, "use_demo": "true"},
        files={"image": ("test_demo.jpg", img_bytes, "image/jpeg")},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["demo_mode"] is True
    assert data["method"] == "demo"
    assert "result_image_base64" in data
    print("test_demo_mode passed!")


def test_live_stability_pipeline_mocked():
    """Verify StabilityProvider async request construction, polling, and response decoding (retained for rollback)."""
    client = TestClient(app)
    img_bytes = _create_dummy_image_bytes("green")

    mock_post_resp = MagicMock()
    mock_post_resp.status_code = 200
    mock_post_resp.headers = {"content-type": "application/json"}
    mock_post_resp.json.return_value = {"id": "test-gen-id-64-chars-0000000000000000000000000000000000000000000000000"}
    mock_post_resp.raise_for_status = MagicMock()

    result_img_buf = io.BytesIO()
    Image.new("RGB", (200, 200), color="white").save(result_img_buf, format="PNG")
    result_png_bytes = result_img_buf.getvalue()

    mock_poll_resp = MagicMock()
    mock_poll_resp.status_code = 200
    mock_poll_resp.headers = {"content-type": "image/png"}
    mock_poll_resp.content = result_png_bytes
    mock_poll_resp.raise_for_status = MagicMock()

    provider = StabilityProvider(api_key="sk-test-key")
    async def run_stab():
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post, \
             patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get, \
             patch("asyncio.sleep", new_callable=AsyncMock):

            mock_post.return_value = mock_post_resp
            mock_get.return_value = mock_poll_resp

            result = await provider.enhance_product(
                img_bytes, "test_live.jpg", "image/jpeg", PhotoStyle.MARKETPLACE, 0
            )

            assert result.success is True
            assert result.demo_mode is False
            assert result.method == "stability:replace-background-and-relight"
            assert len(result.result_image_base64) > 10

            assert mock_post.called
            post_args, post_kwargs = mock_post.call_args
            assert "/v2beta/stable-image/edit/replace-background-and-relight" in post_args[0]
            assert "subject_image" in post_kwargs["files"]
            assert post_kwargs["data"]["preserve_original_subject"] == "0.95"

    import asyncio
    asyncio.run(run_stab())
    print("test_live_stability_pipeline_mocked passed!")


def test_pricing_endpoint():
    """Verify that the XGBoost pricing model loads properly and predicts prices with is_demo=False."""
    client = TestClient(app)
    req_payload = {
        "category": "Carved Woodwork",
        "material": "Seasoned Teakwood",
        "material_cost": 500.0,
        "labour_hours": 20.0,
        "labour_rate": 150.0,
        "quality_score": 4.0,
        "craftsmanship_complexity": 3,
        "size_scale": 3,
        "season_demand_index": 1.1,
        "market_reference_price": 5000.0,
    }
    response = client.post("/api/pricing/predict", json=req_payload)
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    data = response.json()
    assert data["is_demo"] is False, f"Expected is_demo=False (real XGBoost model), but got is_demo={data['is_demo']}"
    assert data["predicted_price"] > 0, "Predicted price should be positive"
    assert data["lower_bound"] < data["predicted_price"] < data["upper_bound"], "Price bounds invalid"
    assert len(data["fair_price_breakdown"]) > 0
    print(f"test_pricing_endpoint passed! Predicted: {data['predicted_price']} (is_demo: {data['is_demo']})")


if __name__ == "__main__":
    test_provider_factory()
    test_bria_request_construction()
    test_bria_live_pipeline_mocked()
    test_bria_error_handling()
    test_demo_mode()
    test_live_stability_pipeline_mocked()
    test_pricing_endpoint()
    print("All tests passed successfully!")


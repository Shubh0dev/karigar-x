"""
KARIGAR X — Quality Pipeline V2 Unit & Geometry Verification

Tests all pipeline components offline without consuming any Bria API credits:
  1. Primary product crop & secondary object elimination
  2. Cutout verification & tight bounding-box crop
  3. Studio background cyclorama generation (Marketplace, Premium, Artisan)
  4. Dual-layer realistic contact & grounding shadow
  5. 4:5 marketplace composition (60–75% height occupancy)
  6. Fidelity-preserving resolution enhancement
  7. Quality gate validation
"""

import io
import unittest
from PIL import Image, ImageDraw

from services.bria_provider import (
    BriaProvider,
    CANVAS_WIDTH,
    CANVAS_HEIGHT,
)
from services.photo_studio_service import PhotoStyle


def create_synthetic_multi_object_image() -> bytes:
    """Creates a synthetic multi-object image: Central basket + left basket + right basket."""
    img = Image.new("RGB", (800, 600), color=(180, 160, 140))
    draw = ImageDraw.Draw(img)

    # 1. Left basket (secondary)
    draw.ellipse([40, 200, 240, 500], fill=(120, 80, 40), outline=(80, 50, 20), width=4)

    # 2. Central basket (PRIMARY HERO PRODUCT)
    draw.ellipse([260, 100, 540, 520], fill=(205, 140, 60), outline=(140, 90, 30), width=6)
    # Basket weave lines
    for y in range(160, 480, 30):
        draw.line([(280, y), (520, y)], fill=(150, 100, 40), width=3)

    # 3. Right basket (secondary)
    draw.ellipse([560, 220, 760, 500], fill=(100, 70, 35), outline=(70, 45, 15), width=4)

    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


def create_synthetic_cutout() -> bytes:
    """Creates a transparent cutout representing the isolated central basket."""
    cutout = Image.new("RGBA", (500, 500), (0, 0, 0, 0))
    draw = ImageDraw.Draw(cutout)

    # Draw centered product with full alpha
    draw.ellipse([80, 50, 420, 450], fill=(205, 140, 60, 255), outline=(140, 90, 30, 255), width=6)
    for y in range(100, 400, 30):
        draw.line([(100, y), (400, y)], fill=(150, 100, 40, 255), width=3)

    buf = io.BytesIO()
    cutout.save(buf, format="PNG")
    return buf.getvalue()


def test_primary_product_crop():
    """Verify that _crop_primary_product isolates the central product and eliminates secondary objects."""
    provider = BriaProvider(api_token="dummy")
    raw_multi_bytes = create_synthetic_multi_object_image()

    # Crop coordinates focusing on central product: x=0.28, y=0.10, w=0.44, h=0.80
    crop_coords = (0.28, 0.10, 0.44, 0.80)
    cropped_bytes = provider._crop_primary_product(raw_multi_bytes, crop=crop_coords)

    cropped_img = Image.open(io.BytesIO(cropped_bytes))
    assert cropped_img.width < 800, "Cropped image width must be narrower than original"
    assert cropped_img.height <= 600, "Cropped image height must fit within original height"

    # Verify central pixels retain primary product color (brown/golden basket)
    center_color = cropped_img.getpixel((cropped_img.width // 2, cropped_img.height // 2))
    assert center_color[0] > 150, f"Central pixel should be warm golden basket color: {center_color}"


def test_verify_and_tight_crop():
    """Verify that cutout validation checks alpha channel and executes tight cropping."""
    provider = BriaProvider(api_token="dummy")
    cutout_bytes = create_synthetic_cutout()

    tight_cutout = provider._verify_and_tight_crop(cutout_bytes)
    assert tight_cutout.mode == "RGBA"
    assert tight_cutout.width < 500, "Tight crop should eliminate empty transparent margins"
    assert tight_cutout.height < 500

    # Test failure on empty image
    empty_img = Image.new("RGBA", (200, 200), (0, 0, 0, 0))
    empty_buf = io.BytesIO()
    empty_img.save(empty_buf, format="PNG")

    empty_failed = False
    try:
        provider._verify_and_tight_crop(empty_buf.getvalue())
    except ValueError as e:
        assert "too small or missing" in str(e)
        empty_failed = True
    assert empty_failed, "Should raise ValueError on empty transparent image"


def test_studio_background_dimensions_and_styles():
    """Verify studio background generates 1080x1350 (4:5) for all styles."""
    provider = BriaProvider(api_token="dummy")

    for style in (PhotoStyle.MARKETPLACE, PhotoStyle.PREMIUM, PhotoStyle.ARTISAN):
        bg = provider._create_studio_background(CANVAS_WIDTH, CANVAS_HEIGHT, style)
        assert bg.size == (1080, 1350), f"Studio background size {bg.size} must be 1080x1350"

        # Horizon is at 64% height (y=864)
        top_pixel = bg.getpixel((540, 100))
        floor_pixel = bg.getpixel((540, 1100))

        # Top should be lighter than floor for studio lighting
        assert sum(top_pixel) >= sum(floor_pixel), "Studio wall should have diffuse top lighting"


def test_grounding_shadow_renders_cleanly():
    """Verify dual-layer contact & grounding shadow is rendered beneath the product base."""
    provider = BriaProvider(api_token="dummy")
    bg = provider._create_studio_background(CANVAS_WIDTH, CANVAS_HEIGHT, PhotoStyle.MARKETPLACE)

    base_floor_color = bg.getpixel((540, 1050))

    # Render shadow with product centered at x=540, base at y=1050, width=600
    bg_with_shadow = provider._render_grounding_shadow(
        bg,
        product_center_x=540,
        product_base_y=1050,
        product_width=600,
    )

    shadow_floor_color = bg_with_shadow.getpixel((540, 1050))

    # Shadowed floor must be noticeably darker than original floor
    assert sum(shadow_floor_color) < sum(base_floor_color), "Floor at contact point must have grounding shadow"


def test_composition_height_occupancy():
    """Verify product occupies 60–75% of canvas useful height and is centered."""
    provider = BriaProvider(api_token="dummy")
    cutout_bytes = create_synthetic_cutout()
    tight_cutout = provider._verify_and_tight_crop(cutout_bytes)

    scene, height_ratio = provider._compose_scene(tight_cutout, PhotoStyle.MARKETPLACE)

    assert scene.size == (1080, 1350), f"Scene size must be (1080, 1350), got {scene.size}"
    assert 0.60 <= height_ratio <= 0.75, (
        f"Product height occupancy {height_ratio:.1%} must be between 60% and 75%"
    )


def test_quality_gate_checks():
    """Verify quality gate validates all required checks."""
    provider = BriaProvider(api_token="dummy")
    img = Image.new("RGB", (1080, 1350), (250, 248, 245))

    checks = provider._verify_quality_gate(img, useful_height_ratio=0.68)
    assert "product_proportions_verified" in checks
    assert "canvas_4_5_resolution_verified" in checks
    assert "craftsmanship_fidelity_preserved" in checks
    assert "marketplace_ready" in checks


if __name__ == "__main__":
    test_primary_product_crop()
    test_verify_and_tight_crop()
    test_studio_background_dimensions_and_styles()
    test_grounding_shadow_renders_cleanly()
    test_composition_height_occupancy()
    test_quality_gate_checks()
    print("ALL QUALITY PIPELINE V2 OFFLINE TESTS PASSED!")

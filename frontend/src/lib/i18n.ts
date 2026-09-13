import { Language } from "./types";

export const translations = {
  en: {
    appName: "KARIGAR X",
    tagline: "AI Virtual Business Manager for Artisans",
    demoMode: "DEMO MODE",
    switchLanguage: "हिन्दी",

    // Navigation
    navHome: "Home",
    navMyProducts: "Inventory",
    navNewCraft: "New Craft",
    navPricing: "Pricing",
    navProfile: "Profile",

    // Common Actions
    btnNext: "Continue",
    btnBack: "Back",
    btnSave: "Save Draft",
    btnPublish: "Publish to B2B Market",
    btnRecordVoice: "Tap to Speak",
    btnStopRecording: "Tap to Stop",
    btnRetakePhoto: "Retake Photo",
    btnEnhancePhoto: "Apply AI Lighting",
    btnCalculatePrice: "Calculate Fair Price",
    btnViewDetails: "View Details",
    btnGoDashboard: "Go to Dashboard",

    // Dashboard
    dashWelcome: "Namaste, Ramesh Ji!",
    dashSubtitle: "Empowering your craft with AI market linkage",
    dashAddNewCraft: "Create New Product",
    dashAddNewCraftSub: "Photo & Voice cataloging in 2 mins",
    dashVoiceAssist: "Voice Assistant",
    dashVoiceAssistSub: "Ask pricing or market guidance",
    dashInventory: "My Crafts",
    dashInventorySub: "Manage listings & orders",
    dashEarnings: "Total Earnings",
    dashRecentCrafts: "Recent Products",

    // Step Indicator
    step1Category: "Category",
    step2Studio: "Photo Studio",
    step3Enhance: "AI Enhance",
    step4Voice: "Voice Story",
    step5Result: "AI Catalogue",
    step6Pricing: "Smart Pricing",
    step7Market: "Publish",

    // Creation Flow Steps
    catTitle: "Choose Craft Category",
    catSubtitle: "Select the primary art form of your product",
    studioTitle: "Product Photo Studio",
    studioSubtitle: "Capture or upload clear photos of your handicraft",
    studioSimulateCamera: "Capture Photo",
    studioSimulateUpload: "Upload from Gallery",
    studioEnhanceNotice: "AI Light & Background Enhancement Active",

    enhanceTitle: "AI Product Studio",
    enhanceSubtitle: "Transforming your photo into a marketplace-ready image",
    enhanceProcessing: "Enhancing your product photo...",
    enhanceBgRemoval: "Removing background...",
    enhanceCropping: "Auto-cropping & centering...",
    enhanceResizing: "Preparing catalogue image...",
    enhanceComplete: "Enhancement Complete!",
    enhanceUseEnhanced: "Use Enhanced Image",
    enhanceUseOriginal: "Use Original Instead",
    enhanceRetake: "Retake Photo",
    enhanceReplace: "Replace Image",
    enhanceFallbackNotice: "Basic enhancement applied (AI model unavailable — background removal skipped)",
    enhanceBgRemovedTag: "Background Removed",
    enhanceCroppedTag: "Auto-Cropped",
    enhanceCenteredTag: "Centered",
    enhanceResizedTag: "Catalogue Ready",

    // AI Product Studio — Pipeline stage labels
    stageAnalyzing: "Analyzing product photo",
    stageDetecting: "Detecting distinct objects",
    stageSelecting: "Selecting primary product",
    stageSegmenting: "Identifying primary product (AI)",
    stageCleaning: "Removing distracting objects",
    stageRemovingDistractions: "Removing secondary distractions",
    stageIsolating: "Isolating product",
    stageStudioBg: "Creating studio background",
    stageBackground: "Creating studio background",
    stageCropping: "Smart centering & composition",
    stageLighting: "Optimizing lighting & exposure",
    stageLightingImprove: "Improving lighting & exposure",
    stageSharpening: "Enhancing product details",
    stageDetailEnhance: "Enhancing craftsmanship & texture",
    stageComposing: "Finalizing marketplace image",
    stageFinalizing: "Finalizing product photo",

    // Enhancement summary labels
    summaryTitle: "What AI did to your photo",
    summaryAnalyzed: "Product photo analyzed",
    summaryBgRemoved: "Background removed (ISNet AI)",
    summaryBgSkipped: "Background removal skipped (AI unavailable)",
    summaryCleaned: "Distracting objects removed",
    summaryBg: "Studio background created",
    summaryCropped: "Product isolated & centered (75-80% frame)",
    summaryLighting: "Lighting & exposure optimized",
    summarySharpened: "Details & weave texture enhanced",
    summaryComposed: "Marketplace format (800×800) ready",
    summaryShadow: "Realistic grounding shadow added",

    // Object Selection UI
    selectProductTitle: "Which product are you selling?",
    selectProductSubtitle: "Multiple objects detected. Choose the primary item to feature in your listing.",
    selectPrimaryCandidate: "Recommended Hero Product",
    selectSecondaryCandidate: "Secondary Item",
    confirmSelection: "Continue with Selected Product",
    detectedCount: "Distinct objects detected",

    // Studio Backdrop Styles
    backdropTitle: "Studio Backdrop Style",
    backdropMarketplace: "Marketplace",
    backdropMarketplaceDesc: "Clean off-white neutral",
    backdropPremium: "Premium",
    backdropPremiumDesc: "Warm beige luxury",
    backdropNatural: "Natural",
    backdropNaturalDesc: "Subtle earthy artisan",

    // Before/After UI
    beforeLabel: "Original Photo",
    afterLabel: "AI Product Studio",
    dragToCompare: "Drag to compare",
    productReady: "Your product photo is ready.",
    
    voiceTitle: "Voice Story Cataloguer",
    voiceSubtitle: "Speak naturally in Hindi or English about your handicraft",
    voiceInstruction: "Tell us: What materials were used? How long did it take to make?",
    voiceListening: "Listening to your voice...",
    voiceTranscribed: "AI Auto-Transcribed Story:",

    resultTitle: "AI Generated Catalogue",
    resultSubtitle: "Automatically created listing title, description & specifications",
    resultCraftStory: "Artisan Craft Story",
    resultMaterials: "Materials & Dimensions",
    
    pricingTitle: "AI Fair Pricing Engine",
    pricingSubtitle: "XGBoost valuation model ensures you get fair market value",
    pricingMaterialCost: "Raw Material Cost (₹)",
    pricingLaborHours: "Labor Hours Spent",
    pricingComplexity: "Craft Complexity Grade",
    pricingMinimumFair: "Minimum Fair Artisan Price",
    pricingSuggestedB2B: "Suggested B2B Market Price",
    pricingFairGuarantee: "100% Fair Price Guarantee (No Exploitation)",

    marketTitle: "Marketplace Ready!",
    marketSubtitle: "Your product is listed for global & domestic buyers",
    marketSuccessMsg: "Craft Tag & QR Code Generated",
    marketChannelB2B: "B2B Export Marketplace",
    marketChannelGovt: "GeM Govt Emporium Portal",
    marketChannelDirect: "Direct Artisan Web Store",
    
    // Inventory
    invTitle: "My Craft Inventory",
    invSubtitle: "Manage digital listings, prices & buyer inquiries",
    invStatusAll: "All Crafts",
    invStatusPublished: "Active B2B",
    invStatusDraft: "Drafts",
    invStatusSold: "Sold Out",

    // Badges & Labels
    badgeVerified: "Master Artisan Verified",
    badgeAiEnhanced: "AI Enhanced",
    badgeFairPrice: "Fair Price Tagged",
  },
  hi: {
    appName: "कारीगर X",
    tagline: "कारीगरों के लिए AI वर्चुअल बिजनेस मैनेजर",
    demoMode: "डेमो मोड",
    switchLanguage: "English",

    // Navigation
    navHome: "होम",
    navMyProducts: "मेरा सामान",
    navNewCraft: "नया उत्पाद",
    navPricing: "दाम कैलकुलेटर",
    navProfile: "प्रोफाइल",

    // Common Actions
    btnNext: "आगे बढ़ें",
    btnBack: "पीछे जाएँ",
    btnSave: "ड्राफ्ट सहेजें",
    btnPublish: "बाज़ार में लिस्ट करें",
    btnRecordVoice: "बोलकर दर्ज करें",
    btnStopRecording: "रोकें",
    btnRetakePhoto: "दोबारा फोटो लें",
    btnEnhancePhoto: "AI लाइटिंग सुधारें",
    btnCalculatePrice: "सही दाम जानें",
    btnViewDetails: "विवरण देखें",
    btnGoDashboard: "डैशबोर्ड पर जाएँ",

    // Dashboard
    dashWelcome: "नमस्ते, रमेश जी!",
    dashSubtitle: "आपकी हस्तकला को AI से मिले सही बाज़ार का साथ",
    dashAddNewCraft: "नया सामान जोड़ें",
    dashAddNewCraftSub: "फोटो और बोलकर 2 मिनट में लिस्ट करें",
    dashVoiceAssist: "आवाज सहायक",
    dashVoiceAssistSub: "दाम और बाज़ार की जानकारी पूछें",
    dashInventory: "मेरे उत्पाद",
    dashInventorySub: "सामान और ऑर्डर प्रबंधित करें",
    dashEarnings: "कुल कमाई",
    dashRecentCrafts: "हाल के उत्पाद",

    // Step Indicator
    step1Category: "श्रेणी",
    step2Studio: "फोटो लें",
    step3Enhance: "AI सुधार",
    step4Voice: "बोलकर विवरण",
    step5Result: "AI कैटलॉग",
    step6Pricing: "सही कीमत",
    step7Market: "लिस्ट हो गया",

    // Creation Flow Steps
    catTitle: "हस्तकला श्रेणी चुनें",
    catSubtitle: "अपने उत्पाद की सही कला श्रेणी का चुनाव करें",
    studioTitle: "उत्पाद फोटो स्टूडियो",
    studioSubtitle: "उत्पाद की साफ़ फोटो खींचें या अपलोड करें",
    studioSimulateCamera: "फोटो खींचें",
    studioSimulateUpload: "गैलरी से चुनें",
    studioEnhanceNotice: "AI लाइटिंग और बैकग्राउंड सुधार सक्रिय है",

    enhanceTitle: "AI उत्पाद स्टूडियो",
    enhanceSubtitle: "आपकी फोटो को बाज़ार के लिए तैयार बना रहा है",
    enhanceProcessing: "आपकी उत्पाद फोटो सुधारी जा रही है...",
    enhanceBgRemoval: "बैकग्राउंड हटाया जा रहा है...",
    enhanceCropping: "ऑटो-क्रॉप और सेंटर हो रहा है...",
    enhanceResizing: "कैटलॉग इमेज तैयार हो रही है...",
    enhanceComplete: "सुधार पूरा हो गया!",
    enhanceUseEnhanced: "सुधरी हुई फोटो लगाएं",
    enhanceUseOriginal: "असली फोटो ही रखें",
    enhanceRetake: "दोबारा फोटो लें",
    enhanceReplace: "नई फोटो चुनें",
    enhanceFallbackNotice: "बेसिक सुधार लागू (AI बैकग्राउंड हटाना संभव नहीं हुआ)",
    enhanceBgRemovedTag: "बैकग्राउंड हटाया",
    enhanceCroppedTag: "ऑटो-क्रॉप",
    enhanceCenteredTag: "सेंटर किया",
    enhanceResizedTag: "कैटलॉग तैयार",

    // AI उत्पाद स्टूडियो — पाइपलाइन चरण
    stageAnalyzing: "उत्पाद फोटो का विश्लेषण",
    stageDetecting: "अलग-अलग उत्पाद खोज रहे हैं",
    stageSelecting: "मुख्य उत्पाद चुना जा रहा है",
    stageSegmenting: "मुख्य उत्पाद पहचाना जा रहा है (AI)",
    stageCleaning: "ध्यान भटकाने वाली चीज़ें हटाई जा रही हैं",
    stageRemovingDistractions: "अतिरिक्त सामान हटाया जा रहा है",
    stageIsolating: "उत्पाद अलग किया जा रहा है",
    stageStudioBg: "स्टूडियो बैकग्राउंड बनाया जा रहा है",
    stageBackground: "स्टूडियो बैकग्राउंड बनाया जा रहा है",
    stageCropping: "स्मार्ट सेंटरिंग और कंपोज़िशन",
    stageLighting: "लाइटिंग और एक्सपोज़र सुधारा जा रहा है",
    stageLightingImprove: "लाइटिंग और एक्सपोज़र सुधारा जा रहा है",
    stageSharpening: "उत्पाद की बारीकियाँ बढ़ाई जा रही हैं",
    stageDetailEnhance: "कारीगरी और बनावट निखारी जा रही है",
    stageComposing: "मार्केटप्लेस इमेज तैयार हो रही है",
    stageFinalizing: "प्रोफेशनल फोटो तैयार हो रही है",

    // सुधार सारांश
    summaryTitle: "AI ने आपकी फोटो में क्या किया",
    summaryAnalyzed: "उत्पाद फोटो का विश्लेषण हुआ",
    summaryBgRemoved: "बैकग्राउंड हटाया (ISNet AI)",
    summaryBgSkipped: "बैकग्राउंड हटाना छोड़ा (AI उपलब्ध नहीं)",
    summaryCleaned: "ध्यान भटकाने वाली चीज़ें हटाई",
    summaryBg: "स्टूडियो बैकग्राउंड बनाया",
    summaryCropped: "उत्पाद अलग और सेंटर किया (75-80% फ्रेम)",
    summaryLighting: "लाइटिंग और एक्सपोज़र सुधारा",
    summarySharpened: "बनावट और किनारों को निखारा",
    summaryComposed: "मार्केटप्लेस फॉर्मेट (800×800) तैयार",
    summaryShadow: "नेचुरल ग्राउंडिंग शैडो जोड़ी गई",

    // Object Selection UI
    selectProductTitle: "आप कौन सा उत्पाद बेच रहे हैं?",
    selectProductSubtitle: "कई सामान पाए गए। मुख्य उत्पाद चुनें जिसे आप कैटलॉग में दिखाना चाहते हैं।",
    selectPrimaryCandidate: "सुझाया गया मुख्य उत्पाद",
    selectSecondaryCandidate: "अन्य सामान",
    confirmSelection: "चुने हुए उत्पाद के साथ आगे बढ़ें",
    detectedCount: "अलग-अलग सामान मिले",

    // Studio Backdrop Styles
    backdropTitle: "स्टूडियो बैकग्राउंड",
    backdropMarketplace: "मार्केटप्लेस",
    backdropMarketplaceDesc: "साफ़ सफ़ेद स्टूडियो",
    backdropPremium: "प्रीमियम",
    backdropPremiumDesc: "वार्म बेज लग्ज़री",
    backdropNatural: "नेचुरल",
    backdropNaturalDesc: "देसी मिट्टी व हथकरघा टोन",

    // Before/After UI
    beforeLabel: "असली फोटो",
    afterLabel: "AI प्रोडक्ट स्टूडियो",
    dragToCompare: "तुलना के लिए खींचें",
    productReady: "आपकी उत्पाद फोटो तैयार है।",
    
    voiceTitle: "बोलकर विवरण दर्ज करें",
    voiceSubtitle: "हिंदी या अपनी भाषा में अपने उत्पाद के बारे में बोलें",
    voiceInstruction: "बताएं: कौन सा सामान लगा? बनाने में कितने घंटे लगे?",
    voiceListening: "आपकी आवाज़ सुनी जा रही है...",
    voiceTranscribed: "AI द्वारा लिखा गया विवरण:",

    resultTitle: "AI कैटलॉग तैयार है",
    resultSubtitle: "स्वचालित रूप से तैयार शीर्षक, कहानी और विवरण",
    resultCraftStory: "कारीगर की हस्तकला कहानी",
    resultMaterials: "सामग्री और माप",
    
    pricingTitle: "AI सही कीमत कैलकुलेटर",
    pricingSubtitle: "XGBoost मॉडल आपकी मेहनत का सही दाम सुनिश्चित करता है",
    pricingMaterialCost: "कच्चे माल की लागत (₹)",
    pricingLaborHours: "बनाने में लगे घंटे",
    pricingComplexity: "कला की बारीकी (ग्रेड)",
    pricingMinimumFair: "कारीगर का न्यूनतम सही दाम",
    pricingSuggestedB2B: "अनुशंसित B2B बाज़ार मूल्य",
    pricingFairGuarantee: "100% सही दाम गारंटी (बिना बिचौलियों के)",

    marketTitle: "बाज़ार में बिक्री के लिए तैयार!",
    marketSubtitle: "आपका उत्पाद देश-विदेश के खरीदारों के लिए उपलब्ध है",
    marketSuccessMsg: "क्राफ्ट टैग और QR कोड तैयार है",
    marketChannelB2B: "B2B एक्सपोर्ट बाज़ार",
    marketChannelGovt: "GeM सरकारी एम्पोरियम",
    marketChannelDirect: "कारीगर सीधा ऑनलाइन स्टोर",

    // Inventory
    invTitle: "मेरे उत्पाद सूची",
    invSubtitle: "अपने सामान, दाम और खरीदार पूछताछ का प्रबंधन करें",
    invStatusAll: "सभी सामान",
    invStatusPublished: "सक्रिय बाज़ार",
    invStatusDraft: "ड्राफ्ट",
    invStatusSold: "बिक चुका",

    // Badges & Labels
    badgeVerified: "प्रमाणित मास्टर कारीगर",
    badgeAiEnhanced: "AI द्वारा सुधारा गया",
    badgeFairPrice: "सही मूल्य टैग",
  },
};

export function getTranslation(lang: Language, key: keyof typeof translations.en): string {
  return translations[lang][key] || translations.en[key] || key;
}

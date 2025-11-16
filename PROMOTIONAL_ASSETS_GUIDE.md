# Chrome Web Store Promotional Assets Guide

Complete guide for creating professional promotional assets for the BookmarkMind Chrome extension listing on the Chrome Web Store.

---

## Table of Contents

1. [Asset Requirements](#asset-requirements)
2. [Design Guidelines](#design-guidelines)
3. [Recommended Tools](#recommended-tools)
4. [Asset Creation Workflows](#asset-creation-workflows)
5. [Screenshot Templates](#screenshot-templates)
6. [Quality Checklist](#quality-checklist)

---

## Asset Requirements

### Required Assets

#### 1. Extension Icons
- **16x16px** - Browser toolbar icon (used in address bar and tabs)
- **48x48px** - Extension management page icon
- **128x128px** - Chrome Web Store listing icon (primary display)

**Format:** PNG with transparency  
**Color:** Consistent brand colors (#4285f4 blue recommended)  
**Status:** ✅ Already included in `/icons/` directory

#### 2. Screenshots (Required - Minimum 1, Maximum 5)

**Small Tile (Required):**
- **Dimensions:** 1280x800px or 640x400px (16:10 aspect ratio)
- **Format:** PNG or JPEG
- **File size:** <10MB per screenshot
- **Recommended:** Use 1280x800px for better quality on high-DPI displays

**Best Practices:**
- Show actual extension UI in use
- Use clean, realistic browser mockups
- Include descriptive overlays (optional but recommended)
- Maintain consistent visual style across all screenshots
- First screenshot is most important (primary listing image)

### Optional Assets (Highly Recommended)

#### 3. Small Promotional Tile
- **Dimensions:** 440x280px
- **Format:** PNG or JPEG
- **Purpose:** Displayed in various Chrome Web Store promotional placements
- **Content:** Extension icon + tagline or key feature highlight

#### 4. Marquee Promotional Tile (Featured Extensions Only)
- **Dimensions:** 1400x560px (5:2 aspect ratio)
- **Format:** PNG or JPEG
- **Purpose:** Used when extension is featured on Chrome Web Store homepage
- **Content:** Hero image with extension branding and key value proposition

---

## Design Guidelines

### Visual Consistency

**Color Palette:**
```
Primary Blue:   #4285f4 (Google Blue)
Success Green:  #4caf50
Warning Orange: #ff9800
Background:     #ffffff
Text Dark:      #333333
Text Light:     #666666
Border Gray:    #e0e0e0
```

**Typography:**
- **Headings:** System fonts (Segoe UI, Roboto, SF Pro)
- **Body:** Clean, readable sans-serif
- **Size:** Minimum 14px for body text in screenshots

**Layout Principles:**
- Clean, uncluttered compositions
- Consistent padding and spacing
- Clear visual hierarchy
- Focus on key features
- Professional, trustworthy aesthetic

### Screenshot Content Guidelines

**DO:**
- Show real extension UI with authentic data
- Highlight key features and benefits
- Use consistent browser mockup style
- Include subtle annotations or callouts
- Demonstrate value proposition clearly
- Show before/after states when applicable

**DON'T:**
- Use placeholder or lorem ipsum text
- Include personal/sensitive information
- Show broken UI or errors
- Use low-resolution or blurry images
- Include browser UI that looks outdated
- Add excessive text overlays

### Brand Voice
- Professional yet approachable
- AI-powered but user-friendly
- Efficient and intelligent
- Privacy-conscious
- Productivity-focused

---

## Recommended Tools

### Design Software

#### Professional (Free Options)
1. **Figma** (figma.com)
   - Best for: UI mockups, collaborative design
   - Cost: Free tier available
   - Templates: Extensive Chrome extension templates

2. **GIMP** (gimp.org)
   - Best for: Image editing, screenshot processing
   - Cost: Free and open-source
   - Platform: Windows, Mac, Linux

3. **Canva** (canva.com)
   - Best for: Quick promotional graphics
   - Cost: Free tier available
   - Templates: Pre-made social media templates

#### Professional (Paid)
1. **Adobe Photoshop**
   - Best for: Professional image editing
   - Cost: $20.99/month (Photography plan)

2. **Sketch** (Mac only)
   - Best for: UI design
   - Cost: $99/year

### Screenshot Tools

1. **Browser DevTools (Built-in)**
   - Press F12 → Device Toolbar (Ctrl+Shift+M)
   - Set custom dimensions (1280x800)
   - Take high-DPI screenshots

2. **Chrome Extension: Awesome Screenshot**
   - Capture full page or selected area
   - Built-in annotation tools

3. **Snagit** (TechSmith)
   - Professional screenshot tool
   - Built-in editing and annotation
   - Cost: $62.99 (one-time)

### Browser Mockup Tools

1. **Mockuphone** (mockuphone.com)
   - Free browser mockups
   - Various device frames

2. **Screely** (screely.com)
   - Instant browser window mockups
   - Clean, minimal style

3. **Cleanmock** (cleanmock.com)
   - Browser mockups with shadows
   - Multiple browser styles

---

## Asset Creation Workflows

### Workflow 1: Screenshot Creation (Standard Method)

#### Step 1: Prepare Extension
1. Load extension in Chrome
2. Configure with sample data:
   - Add 50+ diverse bookmarks
   - Run categorization to create folders
   - Ensure clean, organized state

#### Step 2: Capture Screenshots
```
For Popup UI (1280x800px):
1. Open extension popup
2. Press F12 → Open DevTools
3. Click Device Toolbar icon (Ctrl+Shift+M)
4. Select "Responsive" mode
5. Set dimensions: 1280x800
6. Set DPR (Device Pixel Ratio): 2
7. Capture screenshot: Ctrl+Shift+P → "Capture screenshot"
```

#### Step 3: Add Context (Optional)
1. Open in image editor (Figma/GIMP)
2. Add browser window mockup
3. Include subtle shadows for depth
4. Add text overlays if needed:
   - Feature callouts
   - Benefit statements
   - Version highlights

#### Step 4: Export
- Format: PNG-24 (for transparency) or JPEG (smaller size)
- Compression: Optimize for web (use TinyPNG.com)
- Naming: `screenshot-01-popup.png`

### Workflow 2: Promotional Tile Creation (440x280px)

#### Template Structure
```
┌─────────────────────────────────────┐
│                                     │
│   [Icon 64x64]                     │
│                                     │
│   BookmarkMind                      │
│   AI Bookmark Organizer            │
│                                     │
│   ⚡ Intelligent categorization    │
│   📊 Folder insights               │
│                                     │
└─────────────────────────────────────┘
```

#### Steps
1. Create 440x280px canvas
2. Use light gradient background (#f8f9fa → #ffffff)
3. Place extension icon (64x64) centered top
4. Add extension name (24px bold)
5. Add tagline (16px regular)
6. Add 2-3 key features with emoji icons
7. Export as PNG

### Workflow 3: Marquee Tile Creation (1400x560px)

#### Template Structure
```
┌───────────────────────────────────────────────────────────┐
│                                                           │
│  [Icon 128x128]         BOOKMARKMIND                     │
│                                                           │
│                         AI-Powered Bookmark Management    │
│                                                           │
│                         [Screenshot Preview 600x400]      │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

#### Steps
1. Create 1400x560px canvas
2. Split layout: 40% left (branding), 60% right (preview)
3. Left side:
   - Extension icon (128x128)
   - Extension name (48px bold)
   - Tagline (24px)
   - Key benefit statement (18px)
4. Right side:
   - Feature screenshot or UI preview
   - Subtle shadow/border
5. Export as PNG or JPEG (optimize for <2MB)

---

## Screenshot Templates

### Template 1: Popup UI Overview

**Purpose:** Show main extension interface  
**Dimensions:** 1280x800px  
**Content Focus:** Clean popup with stats, organize button, and features

**Composition:**
```
┌──────────────────────────────────────────────────┐
│                                                  │
│    [Browser Chrome - Optional Mockup]           │
│                                                  │
│    ┌────────────────────────────────┐          │
│    │ BookmarkMind Popup             │          │
│    │                                 │          │
│    │ Total Bookmarks: 247           │          │
│    │ Uncategorized: 12              │          │
│    │                                 │          │
│    │ [Sort Bookmarks Now Button]    │          │
│    │                                 │          │
│    │ Recent Activity:               │          │
│    │ • 35 bookmarks organized       │          │
│    │ • Last run: 2 hours ago        │          │
│    └────────────────────────────────┘          │
│                                                  │
│    Optional: "Instant organization" callout     │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Callouts to Add:**
- "One-click organization" → pointing to Sort button
- "Real-time statistics" → pointing to stats section

### Template 2: Options/Settings Page

**Purpose:** Show customization capabilities  
**Dimensions:** 1280x800px  
**Content Focus:** Settings page with API configuration and categories

**Composition:**
```
┌──────────────────────────────────────────────────┐
│  BookmarkMind Settings                           │
│  ──────────────────────────────────────────      │
│                                                  │
│  API Configuration                               │
│  [Gemini API Key Input]                         │
│  ✓ Connected                                     │
│                                                  │
│  Categories                                      │
│  ☑ Technology  ☑ News  ☑ Shopping               │
│  ☑ Social      ☑ Entertainment                  │
│                                                  │
│  Folder Settings                                 │
│  • Hierarchical organization                     │
│  • Auto-cleanup empty folders                    │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Callouts to Add:**
- "Easy API setup" → pointing to API section
- "Customizable categories" → pointing to categories

### Template 3: Organized Bookmarks View

**Purpose:** Show results - before/after bookmark organization  
**Dimensions:** 1280x800px  
**Content Focus:** Chrome bookmarks manager with organized folders

**Composition:**
```
┌──────────────────────────────────────────────────┐
│  Bookmarks Manager                               │
│  ──────────────────────────────────────────      │
│                                                  │
│  📁 Technology                                   │
│    📁 Development                                │
│      🔖 GitHub - Repository                      │
│      🔖 Stack Overflow                          │
│    📁 AI & Machine Learning                      │
│      🔖 OpenAI Platform                         │
│  📁 News & Media                                 │
│  📁 Shopping                                     │
│  📁 Entertainment                                │
│                                                  │
│  "Automatically organized into 5 categories"     │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Callouts to Add:**
- "Intelligent categorization" → pointing to folders
- "Hierarchical organization" → pointing to subfolder structure

### Template 4: Folder Insights Feature

**Purpose:** Highlight analytics and insights capabilities  
**Dimensions:** 1280x800px  
**Content Focus:** Folder insights panel showing statistics

**Composition:**
```
┌──────────────────────────────────────────────────┐
│  Folder Insights                                 │
│  ──────────────────────────────────────────      │
│                                                  │
│  📊 Technology (156 bookmarks)                   │
│     • Most visited: 45 times this month          │
│     • Growth: +12 new bookmarks                  │
│     • Health: Excellent (no duplicates)          │
│                                                  │
│  📊 News & Media (89 bookmarks)                  │
│     • Most visited: 23 times this month          │
│     • Health: Good (2 broken links detected)     │
│                                                  │
│  📈 Overall Statistics                           │
│     • Total folders: 8                           │
│     • Organization rate: 94%                     │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Callouts to Add:**
- "Deep analytics" → pointing to statistics
- "Track bookmark health" → pointing to health indicators

### Template 5: AI Categorization in Action

**Purpose:** Show AI processing and categorization  
**Dimensions:** 1280x800px  
**Content Focus:** Progress view during categorization

**Composition:**
```
┌──────────────────────────────────────────────────┐
│  Organizing Your Bookmarks...                    │
│  ──────────────────────────────────────────      │
│                                                  │
│  ████████████░░░░░░░░░░░░  60%                 │
│                                                  │
│  Processing bookmark: "React Documentation"      │
│  Category: Technology → Development              │
│                                                  │
│  Progress:                                       │
│  • Analyzed: 156 / 247 bookmarks                │
│  • Categorized: 148                              │
│  • Skipped: 8                                    │
│  • Estimated time: 2 minutes                     │
│                                                  │
│  "AI-powered categorization using Google Gemini" │
│                                                  │
└──────────────────────────────────────────────────┘
```

**Callouts to Add:**
- "Powered by Google Gemini AI" → pointing to AI indicator
- "Real-time progress tracking" → pointing to progress bar

---

## Quality Checklist

### Before Submission

#### Technical Requirements
- [ ] All screenshots are exactly 1280x800px or 640x400px
- [ ] File sizes are under 10MB each
- [ ] Images are PNG or JPEG format
- [ ] No personal or sensitive information visible
- [ ] Icons are PNG with transparency (16x16, 48x48, 128x128)
- [ ] Promotional tile (if included) is 440x280px
- [ ] Marquee tile (if included) is 1400x560px

#### Content Quality
- [ ] UI shown is current extension version
- [ ] No lorem ipsum or placeholder text
- [ ] All text is readable (minimum 14px)
- [ ] Color contrast meets accessibility standards (WCAG AA)
- [ ] Screenshots show real, useful features
- [ ] Consistent visual style across all assets
- [ ] Extension branding is clear and professional

#### Visual Polish
- [ ] No blurry or pixelated images
- [ ] Proper alignment and spacing
- [ ] Clean browser mockups (if used)
- [ ] Subtle shadows/effects for depth
- [ ] Consistent color palette
- [ ] Professional typography
- [ ] No spelling or grammar errors in overlays

#### Strategic Content
- [ ] First screenshot shows most compelling feature
- [ ] Screenshots tell a clear story/flow
- [ ] Key benefits are highlighted
- [ ] Value proposition is obvious
- [ ] Competitive advantages shown
- [ ] Call-to-action implied

---

## Sample Asset File Structure

```
promotional-assets/
├── icons/
│   ├── icon-16.png
│   ├── icon-48.png
│   └── icon-128.png
├── screenshots/
│   ├── 01-popup-overview.png (1280x800)
│   ├── 02-settings-page.png (1280x800)
│   ├── 03-organized-bookmarks.png (1280x800)
│   ├── 04-folder-insights.png (1280x800)
│   └── 05-ai-processing.png (1280x800)
├── promotional/
│   ├── small-tile-440x280.png
│   └── marquee-tile-1400x560.png
├── source-files/
│   ├── screenshots.fig (Figma source)
│   └── promotional.psd (Photoshop source)
└── README.md (this file)
```

---

## Resources & References

### Official Documentation
- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [Chrome Web Store Asset Guidelines](https://developer.chrome.com/docs/webstore/images/)
- [Extension Best Practices](https://developer.chrome.com/docs/extensions/mv3/user_interface/)

### Design Resources
- [Google Design](https://design.google/) - Material Design guidelines
- [Chrome Extension UI Patterns](https://developer.chrome.com/docs/extensions/mv3/user_interface/)
- [Figma Chrome Extension Template](https://www.figma.com/community/search?model_type=files&q=chrome%20extension)

### Image Optimization
- [TinyPNG](https://tinypng.com/) - PNG/JPEG compression
- [Squoosh](https://squoosh.app/) - Image optimization tool by Google
- [ImageOptim](https://imageoptim.com/) - Mac image optimization

### Color & Accessibility
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Coolors](https://coolors.co/) - Color palette generator
- [Adobe Color](https://color.adobe.com/) - Color wheel and schemes

---

## Tips for Success

1. **First Screenshot Matters Most** - It's the primary image shown in search results
2. **Show, Don't Tell** - Actual UI beats marketing graphics
3. **Keep It Simple** - Clean, uncluttered designs perform better
4. **Highlight Unique Features** - Show what makes BookmarkMind different
5. **Update Regularly** - Refresh screenshots when UI changes significantly
6. **Test on Devices** - View on different screen sizes to ensure readability
7. **A/B Test** - Try different screenshot orders to see what performs best
8. **Get Feedback** - Share with potential users before submission

---

## Next Steps

1. Review existing extension UI and identify best features to showcase
2. Capture high-quality screenshots using the workflows above
3. Create promotional tiles for better store visibility
4. Optimize all assets for file size and quality
5. Review against quality checklist
6. Submit to Chrome Web Store Developer Dashboard
7. Monitor performance and iterate based on user feedback

---

**Last Updated:** 2024
**Extension Version:** 1.0.0
**Maintained By:** BookmarkMind Team

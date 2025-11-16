# Publishing Workflow - Chrome Web Store

This guide provides step-by-step instructions for publishing and managing the BookmarkMind extension on the Chrome Web Store.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Preparing Your Extension Package](#preparing-your-extension-package)
3. [Chrome Web Store Developer Dashboard](#chrome-web-store-developer-dashboard)
4. [Creating a New Extension Listing](#creating-a-new-extension-listing)
5. [Uploading the Extension Package](#uploading-the-extension-package)
6. [Store Listing Configuration](#store-listing-configuration)
7. [Promotional Assets](#promotional-assets)
8. [Distribution Settings](#distribution-settings)
9. [Privacy and Compliance](#privacy-and-compliance)
10. [Submitting for Review](#submitting-for-review)
11. [Managing Updates](#managing-updates)
12. [Handling Review Feedback](#handling-review-feedback)
13. [Beta Testing Strategy](#beta-testing-strategy)
14. [Staged Rollout](#staged-rollout)
15. [Publishing Best Practices](#publishing-best-practices)

---

## Prerequisites

### Developer Account Setup

1. **Create Google Developer Account**
   - Visit [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Sign in with your Google account
   - Accept Developer Agreement
   - Pay one-time $5 registration fee

2. **Complete Developer Profile**
   - Navigate to **Account** tab
   - Fill in Developer/Publisher Name
   - Add verified email address
   - Optional: Add website URL

---

## Preparing Your Extension Package

### Creating the ZIP File

1. **Clean Your Directory**
   ```powershell
   # Remove development files not needed for production
   Remove-Item -Path node_modules -Recurse -Force -ErrorAction SilentlyContinue
   Remove-Item -Path .git -Recurse -Force -ErrorAction SilentlyContinue
   Remove-Item -Path tests -Recurse -Force -ErrorAction SilentlyContinue
   ```

2. **Include Only Required Files**
   - `manifest.json`
   - `scripts/` directory (all .js files)
   - `popup/` directory (HTML, CSS, JS)
   - `options/` directory (HTML, CSS, JS)
   - `icons/` directory (all icon sizes)
   - `README.md` (optional but recommended)

3. **Create ZIP Package**
   ```powershell
   # PowerShell command to create ZIP
   Compress-Archive -Path manifest.json,scripts,popup,options,icons -DestinationPath bookmarkmind-v1.0.0.zip
   ```

4. **Verify Package Size**
   - Maximum uncompressed size: 100 MB
   - Maximum compressed size: 25 MB
   - Check file size before uploading

### Pre-Upload Checklist

- [ ] `manifest.json` has correct version number
- [ ] No API keys or secrets in code (use storage API for user keys)
- [ ] All icons present (16x16, 32x32, 48x48, 128x128)
- [ ] `manifest.json` has required permissions only
- [ ] Extension tested in Chrome with "Load unpacked"
- [ ] No errors in Chrome Developer Tools console
- [ ] Linting passed: `npm run lint`
- [ ] Tests passed: `npm run test`

---

## Chrome Web Store Developer Dashboard

### Dashboard Navigation

1. **Access Developer Console**
   - URL: `https://chrome.google.com/webstore/devconsole`
   - Sign in with developer account

2. **Dashboard Sections**
   - **Items**: List of all your extensions
   - **Account**: Developer profile settings
   - **Support**: Help and documentation

3. **Extension Item View**
   - **Package**: Upload new versions
   - **Store Listing**: Configure public-facing information
   - **Privacy**: Privacy policy and permissions justification
   - **Distribution**: Visibility and audience settings
   - **Analytics**: Usage statistics (after publication)

---

## Creating a New Extension Listing

### Initial Setup

1. **Create New Item**
   - Click **New Item** button in Dashboard
   - Upload your prepared ZIP file
   - System validates manifest and package structure
   - Wait for upload to complete (shows progress bar)

2. **Initial Configuration**
   - Extension automatically assigned an Item ID
   - Save Item ID for future updates
   - Dashboard creates draft listing

---

## Uploading the Extension Package

### Upload Process

1. **Navigate to Package Tab**
   - Select your extension from Items list
   - Click **Package** tab on left sidebar

2. **Upload New Package**
   - Click **Upload new package** button
   - Select your ZIP file
   - Wait for upload and validation

3. **Package Validation**
   - Chrome Web Store validates:
     - Manifest format (must be V3)
     - File structure
     - Icon sizes
     - Permissions
     - Code patterns (flags suspicious code)

4. **Validation Results**
   - **Green checkmark**: Package valid, ready to submit
   - **Yellow warning**: Non-critical issues (review recommended)
   - **Red error**: Critical issues (must fix before submission)

### Common Validation Errors

| Error | Solution |
|-------|----------|
| Invalid manifest version | Use `"manifest_version": 3` |
| Missing icon | Include all required icon sizes |
| Invalid permission | Check spelling, use approved permissions |
| Minified/obfuscated code | Avoid obfuscation; explain minification if used |
| Remote code execution | Remove eval(), new Function(), remote scripts |

---

## Store Listing Configuration

### Product Details

1. **Navigate to Store Listing Tab**
   - Click **Store listing** in left sidebar

2. **Required Fields**

   **Extension Name** (45 characters max)
   - Example: `BookmarkMind - AI-Powered Bookmark Manager`
   - Must be unique and descriptive
   - No keyword stuffing

   **Summary** (132 characters max)
   - Example: `Intelligent bookmark organization using AI categorization, duplicate detection, and smart search.`
   - Concise value proposition
   - Appears in search results

   **Description** (16,000 characters max)
   ```
   # Overview
   BookmarkMind transforms bookmark management with AI-powered organization...

   # Key Features
   - **AI Categorization**: Automatically sorts bookmarks into smart folders
   - **Duplicate Detection**: Finds and removes duplicate bookmarks
   - **Smart Search**: Natural language search across all bookmarks
   - **Analytics Dashboard**: Track browsing patterns and insights
   - **Learning System**: Adapts to your organizational preferences

   # How It Works
   1. Install extension and configure AI provider (Gemini or AgentRouter)
   2. Click extension icon to access popup interface
   3. Choose categorization mode and folders to organize
   4. AI analyzes and organizes bookmarks automatically
   5. View analytics and manage settings in Options page

   # Privacy & Security
   - All bookmark data processed locally
   - API keys stored securely in Chrome Storage
   - No data sent to third-party servers except AI API
   - Open source: github.com/yourproject/bookmarkmind

   # Support
   - Email: support@bookmarkmind.com
   - GitHub Issues: github.com/yourproject/bookmarkmind/issues
   - Documentation: bookmarkmind.com/docs
   ```

   **Category**
   - Select: `Productivity`
   - Secondary: `Tools` (if applicable)

   **Language**
   - Select primary language: `English (United States)`
   - Add translations if available

3. **Optional Fields**

   **Website**
   - Project homepage or landing page
   - Example: `https://bookmarkmind.com`

   **Support URL**
   - Link to support documentation or contact page
   - Example: `https://github.com/yourproject/bookmarkmind/issues`

---

## Promotional Assets

### Required Images

1. **Icon** (automatically pulled from manifest)
   - 128x128 PNG
   - Already in your ZIP package

2. **Small Promo Tile** (440x280 pixels, required)
   - PNG or JPEG
   - Appears in Web Store search results
   - No text required but recommended
   - Example: Extension icon + tagline

3. **Marquee Promo Tile** (1400x560 pixels, optional)
   - PNG or JPEG
   - Featured placement (if selected by Chrome)
   - Professional design recommended
   - Include key features or value proposition

### Optional Media

4. **Screenshots** (1280x800 or 640x400, up to 5 images)
   - PNG or JPEG
   - Show actual extension in use
   - Annotate key features
   - Recommended: 3-5 screenshots showing:
     - Main popup interface
     - Categorization in action
     - Analytics dashboard
     - Settings/options page
     - Before/after bookmark organization

5. **Video** (YouTube link)
   - 30-60 second demo
   - Shows installation and key features
   - Optional but increases conversion

### Asset Guidelines

- **High Quality**: Use crisp, professional images
- **Consistent Branding**: Match colors and style across all assets
- **Clear Text**: Use readable fonts (14pt+ for screenshots)
- **No Misleading Content**: Accurately represent features
- **Localization**: Create assets for each language if offering translations

### Asset Upload Process

1. Navigate to **Store listing** tab
2. Scroll to **Graphic assets** section
3. Click **Upload** for each asset type
4. Verify preview before saving
5. Click **Save draft** at bottom of page

---

## Distribution Settings

### Visibility Options

Navigate to **Distribution** tab to configure:

### 1. Public

**Best For**: General release to all Chrome users

**Configuration**:
- Click **Public** radio button
- Extension appears in Web Store search
- Anyone can install via store link
- Maximum visibility and discoverability

**Use Cases**:
- Stable, production-ready releases
- After successful beta testing
- When ready for broad user base

### 2. Unlisted

**Best For**: Beta testing, limited distribution

**Configuration**:
- Click **Unlisted** radio button
- Extension NOT in Web Store search results
- Installable only via direct link
- Link format: `https://chrome.google.com/webstore/detail/[ITEM_ID]`

**Use Cases**:
- Beta testing with select users
- Internal company extensions
- Pre-launch testing
- Soft launch to specific audience

**Sharing the Link**:
```
Beta Test Instructions:
1. Visit: https://chrome.google.com/webstore/detail/abcdefghijklmnop
2. Click "Add to Chrome"
3. Configure AI API key in extension options
4. Report issues: github.com/yourproject/bookmarkmind/issues
```

### 3. Private (Trusted Testers)

**Best For**: Very limited alpha testing

**Configuration**:
- Click **Private** radio button
- Add specific Google account emails
- Only listed emails can install
- Maximum 100 trusted testers

**Use Cases**:
- Alpha testing phase
- Internal development team testing
- Pre-beta validation

**Adding Testers**:
1. Click **Manage Accounts** under Private section
2. Enter email addresses (one per line)
3. Click **Save**
4. Testers receive email notification

### Geographic Distribution

**Region Settings**:
- **All regions**: Default, available worldwide
- **Selected regions**: Choose specific countries
- Use for localized versions or legal compliance

---

## Privacy and Compliance

### Privacy Policy

1. **Navigate to Privacy Tab**
   - Click **Privacy** in left sidebar

2. **Privacy Policy URL** (Required)
   - Must link to publicly accessible privacy policy
   - Example: `https://bookmarkmind.com/privacy`
   - Must explain:
     - What data is collected (bookmark URLs, titles)
     - How data is used (AI categorization)
     - Third-party services (Gemini/AgentRouter API)
     - User data storage (Chrome Storage API)
     - User controls (delete data, API key management)

3. **Sample Privacy Policy Outline**
   ```
   # Privacy Policy for BookmarkMind

   ## Data Collection
   - Bookmark URLs and titles (from Chrome Bookmarks API)
   - User preferences and settings
   - AI API keys (stored locally)

   ## Data Usage
   - Bookmark data sent to AI provider (Gemini/AgentRouter) for categorization
   - Analytics data stored locally for insights
   - No data sold or shared with third parties

   ## User Controls
   - Delete extension to remove all data
   - API keys stored encrypted in Chrome Storage
   - Clear analytics data via options page

   ## Contact
   - Email: privacy@bookmarkmind.com
   ```

### Permissions Justification

1. **Single Purpose** (Required)
   - Describe extension's primary purpose in one sentence
   - Example: `AI-powered bookmark organization and management`

2. **Permission Justifications** (Required for sensitive permissions)
   - Chrome Web Store requires explanation for permissions like:
     - `bookmarks`: Required to read and organize user bookmarks
     - `storage`: Required to save user settings and AI API keys
     - `tabs` (if used): Required to open bookmarks in new tabs
     - `identity` (if used): Required for user authentication

3. **Remote Code** (If Applicable)
   - Explain any externally loaded code
   - BookmarkMind loads no remote code (all bundled)
   - If using CDN libraries, must justify and declare

4. **Data Usage Certification**
   - Review data handling practices
   - Certify compliance with Chrome Web Store policies
   - Check boxes for required certifications

---

## Submitting for Review

### Pre-Submission Checklist

- [ ] Package uploaded and validated (green checkmark)
- [ ] Store listing complete (name, summary, description)
- [ ] All promotional assets uploaded
- [ ] Privacy policy URL added
- [ ] Permissions justified
- [ ] Distribution settings configured
- [ ] Pricing (free) confirmed

### Submission Process

1. **Review All Tabs**
   - Package: Green checkmark visible
   - Store listing: All required fields filled
   - Privacy: Policy URL and justifications complete
   - Distribution: Visibility set correctly

2. **Click "Submit for Review"**
   - Button appears at top right of Dashboard
   - Located in Package tab
   - Confirm submission in dialog

3. **Review Timeline**
   - **Initial review**: 1-3 business days (typical)
   - **Complex reviews**: Up to 1-2 weeks
   - **Resubmissions**: Usually faster (hours to 1 day)

4. **Status Indicators**
   - **Pending review**: Yellow clock icon
   - **Approved**: Green checkmark, published automatically
   - **Rejected**: Red X, email with feedback

### During Review

- **Monitor Email**: Chrome sends updates to developer email
- **Check Dashboard**: Status visible in Items list
- **Be Patient**: Don't resubmit unless explicitly rejected
- **Respond Promptly**: If reviewer requests more info, reply quickly

---

## Managing Updates

### Releasing New Versions

1. **Update manifest.json Version**
   ```json
   {
     "manifest_version": 3,
     "name": "BookmarkMind",
     "version": "1.0.1",  // Increment version
     ...
   }
   ```

2. **Create Updated ZIP Package**
   ```powershell
   Compress-Archive -Path manifest.json,scripts,popup,options,icons -DestinationPath bookmarkmind-v1.0.1.zip
   ```

3. **Upload to Dashboard**
   - Navigate to **Package** tab
   - Click **Upload new package**
   - Select new ZIP file
   - Wait for validation

4. **Update Store Listing (if needed)**
   - Modify description to mention new features
   - Add new screenshots if UI changed
   - Update promotional assets if rebranded

5. **Submit for Review**
   - Click **Submit for review** after upload
   - Updates go through same review process
   - Typically faster than initial review

### Version Numbering

Use semantic versioning: `MAJOR.MINOR.PATCH`

- **PATCH** (1.0.0 → 1.0.1): Bug fixes, minor tweaks
- **MINOR** (1.0.0 → 1.1.0): New features, backward compatible
- **MAJOR** (1.0.0 → 2.0.0): Breaking changes, major overhaul

### Update Deployment

- **Automatic Updates**: Chrome updates extensions automatically within 5 hours
- **User Control**: Users can disable auto-update (rare)
- **Force Update**: Not possible; respect user settings

---

## Handling Review Feedback

### Common Rejection Reasons

1. **Permission Overreach**
   - **Issue**: Requesting unnecessary permissions
   - **Solution**: Remove unused permissions from manifest
   - **Example**: Remove `tabs` if not actually used

2. **Unclear Privacy Policy**
   - **Issue**: Privacy policy doesn't explain data usage
   - **Solution**: Add detailed explanation of AI API data flow
   - **Example**: Specify that bookmark URLs sent to Gemini API

3. **Misleading Listing**
   - **Issue**: Store listing promises features not present
   - **Solution**: Accurate description matching actual functionality
   - **Example**: Don't claim "free" if features require paid API key

4. **Minified Code Without Explanation**
   - **Issue**: Obfuscated code raises security concerns
   - **Solution**: Include unminified source or explain build process
   - **Example**: Provide GitHub link to source code

5. **Spam/Low Quality**
   - **Issue**: Too generic, clone of existing extension
   - **Solution**: Emphasize unique value proposition
   - **Example**: Highlight AI-powered categorization vs manual sorting

### Responding to Rejection

1. **Read Email Carefully**
   - Chrome sends detailed rejection reasons
   - Note specific policy violations cited
   - Check for required actions

2. **Fix Issues**
   - Address ALL points mentioned in rejection
   - Don't just fix one issue and resubmit
   - Test thoroughly after fixes

3. **Update Submission**
   - Upload fixed package if code changes needed
   - Update store listing if descriptions misleading
   - Add/clarify privacy policy if incomplete

4. **Reply to Review Team (if applicable)**
   - Some rejections allow direct reply
   - Explain fixes made
   - Provide additional context if needed
   - Be professional and concise

5. **Resubmit**
   - Click **Submit for review** again
   - Usually reviewed within 24 hours
   - May require multiple iterations for complex issues

### Appealing Rejections

If you believe rejection was incorrect:

1. **Contact Support**
   - Use "Contact Us" link in Developer Dashboard
   - Explain disagreement politely
   - Provide evidence/documentation

2. **Developer Forum**
   - Post in [Chromium Extensions Google Group](https://groups.google.com/a/chromium.org/forum/#!forum/chromium-extensions)
   - Community and Googlers may assist

3. **Be Patient**
   - Appeals take time (weeks possible)
   - Continue addressing feedback in parallel

---

## Beta Testing Strategy

### Phase 1: Private Alpha

**Objective**: Catch critical bugs before wider release

1. **Setup Private Distribution**
   - Set visibility to **Private**
   - Add 5-10 trusted testers (team members, close friends)

2. **Testing Focus**
   - Core functionality (categorization, search)
   - API integration (Gemini, AgentRouter)
   - Error handling
   - Performance on different bookmark sizes

3. **Duration**: 1-2 weeks

4. **Feedback Collection**
   - GitHub Issues (private repo or unlisted)
   - Google Form survey
   - Direct communication (email, Slack)

### Phase 2: Unlisted Beta

**Objective**: Gather feedback from broader audience

1. **Setup Unlisted Distribution**
   - Change visibility to **Unlisted**
   - Share direct link via:
     - Product Hunt (beta community)
     - Reddit (r/chrome, r/productivity)
     - Twitter/social media
     - Email to interested users

2. **Testing Focus**
   - User experience and UI
   - Edge cases (large bookmark libraries)
   - Feature requests
   - Cross-browser compatibility (if supporting Edge)

3. **Duration**: 2-4 weeks

4. **Feedback Collection**
   - Google Analytics (add to extension)
   - User surveys (in-extension or web form)
   - GitHub Issues (public repo)
   - Chrome Web Store reviews (even unlisted can have reviews)

5. **Beta Communication**
   ```
   🚀 BookmarkMind Beta is Live!

   Help us test the future of bookmark management.

   Install: https://chrome.google.com/webstore/detail/[ITEM_ID]

   What we need:
   - Test with your real bookmarks (make backup!)
   - Report bugs: github.com/yourproject/issues
   - Share feedback: [survey link]

   Beta perks:
   - Early access to new features
   - Direct influence on roadmap
   - Recognition in contributors list
   ```

### Phase 3: Public Release

**Objective**: Launch to all Chrome users

1. **Setup Public Distribution**
   - Change visibility to **Public**
   - Extension appears in Web Store search

2. **Launch Activities**
   - Product Hunt launch
   - Blog post announcement
   - Social media campaign
   - Press outreach (tech blogs)
   - Update README with store link

3. **Monitoring**
   - Daily check of reviews/ratings
   - Monitor error reports
   - Track installation growth
   - Respond to user questions

---

## Staged Rollout

### Manual Staged Rollout

Chrome Web Store doesn't have built-in staged rollout, but you can simulate it:

#### Method 1: Unlisted to Public Transition

1. **Week 1**: Release as **Unlisted**
   - Share link to limited audience (1,000 users)
   - Monitor for critical issues
   - Respond to early feedback

2. **Week 2-3**: Continue **Unlisted**
   - Expand sharing (10,000 users)
   - Release patch updates if needed
   - Build confidence in stability

3. **Week 4+**: Switch to **Public**
   - Change visibility setting
   - Announce public availability
   - Now discoverable by all users

#### Method 2: Version-Based Rollout

1. **Stable Channel** (Public, v1.0.0)
   - Conservative updates
   - Only release after thorough beta testing
   - Existing users stay on this version

2. **Beta Channel** (Unlisted, v1.1.0-beta)
   - Create separate extension listing (different Item ID)
   - Name: "BookmarkMind Beta"
   - Share with opt-in beta testers
   - Fast-paced updates

3. **Promotion**
   - After beta testing complete, release v1.1.0 to stable channel
   - Both extensions can coexist (different IDs)

### Monitoring During Rollout

1. **Key Metrics**
   - Install count (daily, weekly)
   - Rating and reviews (track sentiment)
   - Crash reports (if using error tracking)
   - Uninstall rate (available in Analytics tab)

2. **Rollback Plan**
   - Keep previous version ZIP file
   - If critical issue found, upload previous version
   - Submit for expedited review (explain urgency)

3. **Communication**
   - Update extension description with known issues
   - Respond to negative reviews promptly
   - Post status updates on social media/blog

---

## Publishing Best Practices

### Before Launch

1. **Thorough Testing**
   - Test on fresh Chrome profile
   - Test with small and large bookmark libraries
   - Test all permissions and API integrations
   - Test error scenarios (invalid API key, network failure)

2. **Documentation**
   - Complete README.md
   - Create user guide (can be in-extension or website)
   - Record demo video
   - Write FAQ

3. **Legal Compliance**
   - Review Chrome Web Store Program Policies
   - Ensure GDPR compliance (if serving EU users)
   - Privacy policy accessible without installing extension
   - Terms of Service (if applicable)

4. **Branding**
   - Professional icon design
   - Consistent color scheme
   - Memorable name
   - Clear value proposition

### Store Listing Optimization

1. **Title Best Practices**
   - Front-load keywords (but don't stuff)
   - Example: "BookmarkMind - AI Bookmark Manager & Organizer"
   - Include primary benefit

2. **Description Best Practices**
   - Use formatting (headers, bullets, bold)
   - Start with compelling value proposition
   - Explain how it works (3-5 steps)
   - Address common questions
   - Include keywords naturally
   - Add social proof (if available: "1000+ users")
   - Clear call-to-action

3. **Screenshots Best Practices**
   - Use 1280x800 resolution for clarity
   - Add annotations explaining features
   - Show progression (before → after)
   - Include captions on images
   - First screenshot is most important (appears in search)

4. **Promotional Image Best Practices**
   - Small tile (440x280): Simple, recognizable at small size
   - Marquee (1400x560): Professional, highlights 3-4 key features
   - Match brand colors
   - Include extension icon for recognition

### After Launch

1. **Review Management**
   - Respond to all reviews within 48 hours
   - Thank positive reviewers
   - Address issues in negative reviews
   - Use template responses for common questions
   - Update extension based on feedback

2. **Regular Updates**
   - Release updates every 4-8 weeks (if actively developing)
   - Bug fixes as needed (prioritize critical issues)
   - Communicate update contents in description
   - Maintain changelog in GitHub and README

3. **Community Building**
   - Create GitHub Discussions or Discord
   - Share roadmap publicly
   - Feature user success stories
   - Acknowledge contributors

4. **Analytics Review**
   - Weekly: Check installations, ratings, reviews
   - Monthly: Analyze user retention (if tracking)
   - Quarterly: Review feature usage, plan roadmap

5. **Marketing**
   - Submit to extension directories (alternativeto.net, etc.)
   - Write blog posts about use cases
   - Create tutorial videos
   - Engage on social media
   - Reach out to productivity bloggers

### Security and Maintenance

1. **Dependency Updates**
   - Monitor for security vulnerabilities
   - Update Chrome APIs when deprecated
   - Test after Chrome version updates

2. **API Key Security**
   - Never hardcode API keys
   - Clear documentation on where users get keys
   - Warn users about keeping keys private

3. **User Data Protection**
   - Minimize data collection
   - Encrypt sensitive data in storage
   - Provide data export/delete options
   - Be transparent about AI API data flow

4. **Incident Response**
   - Have plan for security issues
   - Fast-track critical patches
   - Communicate transparently with users
   - Consider disclosure timeline for vulnerabilities

---

## Quick Reference

### Store Listing Checklist

- [ ] Extension name (45 chars max)
- [ ] Summary (132 chars max)
- [ ] Description (clear, formatted, keyword-rich)
- [ ] Category selected
- [ ] Icon (128x128, in manifest)
- [ ] Small promo tile (440x280)
- [ ] 3-5 screenshots (1280x800)
- [ ] Privacy policy URL
- [ ] Support URL
- [ ] Website URL (optional)

### Review Preparation Checklist

- [ ] manifest.json version incremented
- [ ] All permissions justified
- [ ] Privacy policy up to date
- [ ] No hardcoded secrets/keys
- [ ] Extension tested on fresh Chrome profile
- [ ] No console errors
- [ ] Lint passed
- [ ] Tests passed

### Update Release Checklist

- [ ] Version number incremented
- [ ] CHANGELOG updated
- [ ] New ZIP created and tested
- [ ] Store listing updated (if needed)
- [ ] Package uploaded to Dashboard
- [ ] Submitted for review
- [ ] Announcement prepared for after approval

---

## Resources

- **Chrome Web Store Developer Dashboard**: https://chrome.google.com/webstore/devconsole
- **Developer Program Policies**: https://developer.chrome.com/docs/webstore/program-policies/
- **Extension Publishing Guide**: https://developer.chrome.com/docs/webstore/publish/
- **Best Practices**: https://developer.chrome.com/docs/webstore/best_practices/
- **Manifest V3 Migration**: https://developer.chrome.com/docs/extensions/migrating/
- **User Data FAQ**: https://developer.chrome.com/docs/webstore/user_data/
- **Developer Support**: https://groups.google.com/a/chromium.org/g/chromium-extensions

---

## Troubleshooting

### "Package is invalid" Error

- Verify manifest.json is valid JSON
- Check manifest_version is 3
- Ensure all referenced files exist in ZIP
- Verify icon paths match manifest declarations

### "Your account is suspended"

- Check email for suspension notice
- Review Program Policies violation cited
- Contact support via Dashboard
- Submit appeal if suspension incorrect

### Updates Not Appearing for Users

- Confirm update was approved (check Dashboard status)
- Wait 5+ hours for Chrome auto-update cycle
- Users can manually update: chrome://extensions → Developer mode → Update

### Low Installation Rate

- Improve store listing (title, description, screenshots)
- Add video demo
- Get initial reviews from beta testers
- Share on social media and forums
- Consider unlisted soft launch first

---

*Last Updated: 2024*
*Extension: BookmarkMind v1.0.0*

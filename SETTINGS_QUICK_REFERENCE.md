# BookmarkMind Settings Quick Reference

## 🚀 Quick Start Presets

### Beginner (Simple & Safe)

```
Batch Size: 25
AI Confidence: 80%
Max Category Depth: 2
Min Categories: 10
Max Categories: 30
Hierarchical Mode: Enabled
Auto Snapshot: Enabled
```

### Power User (Fast & Efficient)

```
Batch Size: 100
AI Confidence: 70%
Max Category Depth: 3
Min Categories: 15
Max Categories: 50
Hierarchical Mode: Enabled
Caching: Enabled
Preferred Provider: Groq
```

### Perfectionist (Maximum Accuracy)

```
Batch Size: 25
AI Confidence: 90%
Max Category Depth: 4
Learning Weight: 80%
Enable Learning: Yes
Retry Attempts: 3
Auto Snapshot: Enabled
```

## 📊 Settings at a Glance

| Setting             | Default | Range/Options | Impact                  |
| ------------------- | ------- | ------------- | ----------------------- |
| **Batch Size**      | 50      | 10-150        | Speed vs Safety         |
| **AI Confidence**   | 70%     | 50-95%        | Accuracy vs Coverage    |
| **Category Depth**  | 2       | 1-4           | Organization Complexity |
| **Min Categories**  | 15      | 5-30          | Granularity             |
| **Max Categories**  | 50      | 20-100        | Detail Level            |
| **Learning Weight** | 50%     | 0-100%        | AI vs Your Patterns     |
| **Retry Attempts**  | 2       | 0-5           | Reliability             |
| **Request Timeout** | 30s     | 10-60s        | Patience                |
| **Max Snapshots**   | 5       | 3-20          | Storage                 |

## 🎯 Common Scenarios

### "I have 5000+ bookmarks"

-   Batch Size: 25-50
-   Enable Caching: Yes
-   Auto Snapshot: Yes
-   AI Confidence: 75%

### "I want it done fast"

-   Batch Size: 150
-   Preferred Provider: Groq
-   Request Timeout: 20s
-   Retry Attempts: 1

### "I'm very particular about organization"

-   AI Confidence: 85-90%
-   Learning Weight: 70-80%
-   Enable Learning: Yes
-   Max Category Depth: 3-4

### "I keep running out of storage"

-   Max Snapshots: 3
-   Cache Expiration: 7 days
-   Disable Detailed Logs

### "Categorization keeps failing"

-   Retry Attempts: 3-5
-   Request Timeout: 45-60s
-   Enable Fallback Providers: Yes
-   Batch Size: 25

## 🔧 Troubleshooting Settings

| Problem             | Solution                                       |
| ------------------- | ---------------------------------------------- |
| Too slow            | ↑ Batch Size, Enable Caching, ↓ Retry Attempts |
| Inaccurate          | ↑ AI Confidence, Enable Learning, ↓ Batch Size |
| API errors          | ↓ Batch Size, ↑ Timeout, ↑ Retry Attempts      |
| Storage full        | ↓ Max Snapshots, ↓ Cache Expiration            |
| Too many categories | ↓ Max Categories, ↑ Min Bookmarks/Folder       |
| Too few categories  | ↑ Max Categories, ↓ Min Bookmarks/Folder       |

## 💡 Pro Tips

1. **Start Conservative**: Use default settings first, then adjust based on results
2. **Enable Learning**: Let the extension learn from your corrections for better results over time
3. **Use Snapshots**: Always keep auto-snapshot enabled for safety
4. **Monitor Performance**: Check the Performance Monitoring section to see what's working
5. **Experiment**: Try different AI providers to see which works best for your bookmarks
6. **Cache Wisely**: Enable caching for speed, but clear it if you change settings significantly
7. **Batch Appropriately**: Larger batches are faster but may hit rate limits
8. **Confidence Balance**: 70-80% is usually the sweet spot for most users

## 🎨 Theme Options

-   **Auto**: Matches your system theme
-   **Light**: Classic bright interface
-   **Dark**: Easy on the eyes (coming soon)

## 📱 Notification Settings

-   **Progress Notifications**: See real-time updates during categorization
-   **Detailed Logs**: Enable only when troubleshooting (impacts performance)

## 🔄 Reset Options

-   **Reset Advanced Settings**: Resets all advanced settings to defaults (keeps API keys)
-   **Reset All Settings**: Complete reset including categories (keeps API keys)
-   **Clear Learning Data**: Removes all learned patterns (cannot be undone)

## 📈 Recommended Upgrade Path

1. **Week 1**: Use defaults, let learning system collect data
2. **Week 2**: Adjust AI confidence based on accuracy
3. **Week 3**: Fine-tune batch size and category limits
4. **Week 4**: Optimize for your workflow with custom presets

## 🆘 Need Help?

-   Check the Performance Monitoring section for insights
-   Review the AI Model Comparison dashboard
-   Export analytics report for detailed analysis
-   Visit GitHub issues for community support

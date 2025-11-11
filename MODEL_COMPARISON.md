# AI Model Comparison and Optimization Features

This document describes the AI model performance comparison, optimization, and cost tracking features in BookmarkMind.

## Features Overview

### 1. Model Performance Comparison Dashboard

Access via: **Settings → View AI Model Comparison Dashboard**

The dashboard provides comprehensive performance metrics for all AI models:

- **Success Rate**: Percentage of successful categorizations
- **Average Speed**: Mean response time in milliseconds
- **Total Cost**: Cumulative API costs for each model
- **Cost per Call**: Average cost per API request
- **Total Calls**: Number of times each model was used

Models are automatically ranked by overall performance score (weighted by success rate, speed, and cost).

### 2. A/B Testing Mode

Compare two AI models side-by-side:

1. Navigate to **AI Model Comparison → A/B Testing** tab
2. Select Model A and Model B from dropdowns
3. Choose sample size (number of bookmarks to test)
4. Click "Start A/B Test"

Results show:
- Success rates for both models
- Response time comparison
- Cost comparison
- Side-by-side categorization results

Previous test results are saved and can be reviewed.

### 3. Cost Tracking and Budget Alerts

#### Setting Up Budget Alerts

1. Go to **AI Model Comparison → Cost Tracking** tab
2. Enable budget alerts checkbox
3. Set limits:
   - Daily limit (e.g., $0.50)
   - Weekly limit (e.g., $2.00)
   - Monthly limit (e.g., $5.00)
4. Set alert threshold (default: 80%)
5. Click "Save Budget Settings"

When spending reaches the threshold percentage, you'll receive console warnings and alerts.

#### Cost Reports

View detailed cost breakdowns by:
- Time period (last 24 hours, 7 days, 30 days, all time)
- Provider (Gemini, Cerebras, Groq)
- Model
- Daily trends

#### Cost Estimation

Costs are estimated based on:
- **Token usage** (input + output tokens)
- **Model-specific pricing**:
  - Gemini 2.5 Pro: $1.25/$5.00 per 1M input/output tokens
  - Gemini 2.5 Flash: $0.075/$0.30 per 1M input/output tokens
  - Cerebras models: $0.10-$0.60 per 1M tokens
  - Groq models: Free tier (currently $0)

### 4. Model Recommendation Engine

The system automatically recommends the best model based on:

- **Historical performance** for similar bookmark types
- **User's categorization history**
- **Weighted scoring**:
  - Success rate: 50%
  - Speed: 30%
  - Cost: 20%

Recommendations include:
- Confidence level (low/medium/high) based on sample size
- Reason for recommendation
- Performance metrics

Access recommendations in the **Overview** tab of Model Comparison Dashboard.

### 5. Custom Model Configuration

Fine-tune AI model parameters:

#### Temperature (0.0 - 2.0)
- Lower values (0.1-0.5): More focused, deterministic categorizations
- Medium values (0.7-1.0): Balanced creativity and consistency (recommended)
- Higher values (1.2-2.0): More creative, diverse categorizations

#### Top P / Nucleus Sampling (0.0 - 1.0)
- Controls diversity of outputs
- Lower values (0.5-0.7): More focused responses
- Higher values (0.9-0.95): More diverse responses (recommended)

#### Max Tokens (100 - 8000)
- Maximum length of AI response
- Recommended: 2048 for most cases
- Increase for very large bookmark batches

#### Configuration Steps

1. Go to **AI Model Comparison → Model Configuration** tab
2. Adjust sliders for temperature and top_p
3. Set max_tokens value
4. Configure batch size mode
5. Click "Save Configuration"
6. Click "Reset to Defaults" to restore original settings

### 6. Batch Size Optimizer

Automatically adjusts batch size based on:
- Number of bookmarks to process
- AI provider rate limits
- Historical performance data

#### Batch Size Modes

**Automatic (Recommended)**
- Dynamically calculates optimal batch size
- Considers:
  - Gemini: max 100 bookmarks, 15 requests/minute
  - Cerebras: max 50 bookmarks, 60 requests/minute
  - Groq: max 100 bookmarks, 30 requests/minute

**Small (10-25 bookmarks)**
- Best for: Testing, low-volume processing
- Advantage: Lower cost per failed batch

**Medium (25-50 bookmarks)**
- Best for: Regular use, moderate bookmark sets
- Advantage: Balanced speed and reliability

**Large (50-100 bookmarks)**
- Best for: Large bookmark collections, bulk operations
- Advantage: Fastest processing for large sets

**Custom**
- Manually specify batch size (1-100)
- Use with caution to avoid rate limits

## Data Storage

All performance data is stored locally in Chrome storage:

- **Model Performance**: Last 1000 records per model
- **A/B Tests**: Last 100 tests
- **Cost History**: Last 10,000 cost records
- **Aggregate Statistics**: Lifetime totals by model and provider

## Best Practices

1. **Start with Automatic Settings**: Use default temperature (1.0), top_p (0.95), and automatic batch sizing
2. **Monitor Costs**: Set conservative budget alerts initially ($1-2/month)
3. **Run A/B Tests**: Compare models quarterly to identify best performers
4. **Review Dashboard Weekly**: Check for performance trends or cost spikes
5. **Adjust Based on Data**: Only change model configuration if seeing consistent issues

## Troubleshooting

### No Performance Data Showing
- Run at least one categorization to generate data
- Ensure ModelComparisonService is loaded (check browser console)

### Budget Alerts Not Working
- Verify budget alert is enabled
- Check that limits are set (not null/0)
- Review cost tracking history in dashboard

### A/B Test Fails
- Ensure both models' API keys are configured
- Check sufficient bookmarks available for sample size
- Review browser console for error messages

### Recommendations Show "Low Confidence"
- Need minimum 20-50 categorizations per model for medium confidence
- Continue using the extension to build performance history

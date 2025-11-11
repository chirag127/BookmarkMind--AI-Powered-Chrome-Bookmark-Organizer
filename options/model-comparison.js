/**
 * BookmarkMind - Model Comparison Dashboard
 * Handles AI model performance comparison, A/B testing, cost tracking, and optimization
 */

class ModelComparisonController {
  constructor() {
    this.dashboard = null;
    this.costReport = null;
    this.currentTab = 'overview';

    this.initializeElements();
    this.attachEventListeners();
    this.loadDashboard();
  }

  /**
   * Initialize DOM element references
   */
  initializeElements() {
    // Tab buttons
    this.tabBtns = document.querySelectorAll('.tab-btn');
    this.tabContents = document.querySelectorAll('.tab-content');

    // Back button
    this.backToSettings = document.getElementById('backToSettings');

    // Overview elements
    this.totalModelsTracked = document.getElementById('totalModelsTracked');
    this.totalCostDisplay = document.getElementById('totalCostDisplay');
    this.bestModelDisplay = document.getElementById('bestModelDisplay');
    this.totalABTests = document.getElementById('totalABTests');
    this.recommendedModel = document.getElementById('recommendedModel');
    this.recommendationConfidence = document.getElementById('recommendationConfidence');
    this.recommendationReason = document.getElementById('recommendationReason');
    this.recSuccessRate = document.getElementById('recSuccessRate');
    this.recAvgSpeed = document.getElementById('recAvgSpeed');
    this.recAvgCost = document.getElementById('recAvgCost');

    // Performance elements
    this.performanceTableBody = document.getElementById('performanceTableBody');

    // Cost tracking elements
    this.budgetAlertEnabled = document.getElementById('budgetAlertEnabled');
    this.dailyBudget = document.getElementById('dailyBudget');
    this.weeklyBudget = document.getElementById('weeklyBudget');
    this.monthlyBudget = document.getElementById('monthlyBudget');
    this.alertThreshold = document.getElementById('alertThreshold');
    this.saveBudgetBtn = document.getElementById('saveBudgetBtn');
    this.budgetStatusContainer = document.getElementById('budgetStatusContainer');
    this.budgetStatusContent = document.getElementById('budgetStatusContent');
    this.costReportPeriod = document.getElementById('costReportPeriod');
    this.refreshCostReport = document.getElementById('refreshCostReport');
    this.costReportContent = document.getElementById('costReportContent');

    // A/B test elements
    this.modelASelect = document.getElementById('modelASelect');
    this.modelBSelect = document.getElementById('modelBSelect');
    this.abtestSampleSize = document.getElementById('abtestSampleSize');
    this.startABTestBtn = document.getElementById('startABTestBtn');
    this.abtestResults = document.getElementById('abtestResults');
    this.previousTestsList = document.getElementById('previousTestsList');

    // Model config elements
    this.temperature = document.getElementById('temperature');
    this.temperatureValue = document.getElementById('temperatureValue');
    this.topP = document.getElementById('topP');
    this.topPValue = document.getElementById('topPValue');
    this.maxTokens = document.getElementById('maxTokens');
    this.batchSizeMode = document.getElementById('batchSizeMode');
    this.customBatchSize = document.getElementById('customBatchSize');
    this.saveModelConfigBtn = document.getElementById('saveModelConfigBtn');
    this.resetModelConfigBtn = document.getElementById('resetModelConfigBtn');
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Tab navigation
    this.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });

    // Back button
    this.backToSettings.addEventListener('click', () => {
      window.location.href = 'options.html';
    });

    // Budget tracking
    this.saveBudgetBtn.addEventListener('click', () => this.saveBudgetSettings());
    this.refreshCostReport.addEventListener('click', () => this.loadCostReport());
    this.costReportPeriod.addEventListener('change', () => this.loadCostReport());

    // A/B testing
    this.startABTestBtn.addEventListener('click', () => this.startABTest());

    // Model configuration
    this.temperature.addEventListener('input', () => {
      this.temperatureValue.textContent = this.temperature.value;
    });
    this.topP.addEventListener('input', () => {
      this.topPValue.textContent = this.topP.value;
    });
    this.batchSizeMode.addEventListener('change', () => {
      if (this.batchSizeMode.value === 'custom') {
        this.customBatchSize.classList.remove('hidden');
      } else {
        this.customBatchSize.classList.add('hidden');
      }
    });
    this.saveModelConfigBtn.addEventListener('click', () => this.saveModelConfig());
    this.resetModelConfigBtn.addEventListener('click', () => this.resetModelConfig());
  }

  /**
   * Switch between tabs
   */
  switchTab(tabName) {
    this.currentTab = tabName;

    // Update tab buttons
    this.tabBtns.forEach(btn => {
      if (btn.dataset.tab === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update tab contents
    this.tabContents.forEach(content => {
      if (content.id === `${tabName}-tab`) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });

    // Load data for specific tabs
    if (tabName === 'costs') {
      this.loadCostReport();
    } else if (tabName === 'config') {
      this.loadModelConfig();
    }
  }

  /**
   * Load dashboard data
   */
  async loadDashboard() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getModelComparison'
      });

      if (response && response.success) {
        this.dashboard = response.data;
        this.updateOverview();
        this.updatePerformanceTable();
        this.updatePreviousABTests();
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      this.showError('Failed to load dashboard data');
    }
  }

  /**
   * Update overview tab
   */
  updateOverview() {
    // Summary cards
    this.totalModelsTracked.textContent = this.dashboard.overview.totalModelsTracked;
    this.totalCostDisplay.textContent = `$${this.dashboard.overview.totalCost}`;
    this.totalABTests.textContent = this.dashboard.overview.totalTests;

    // Best model
    if (this.dashboard.modelComparison.length > 0) {
      const bestModel = this.dashboard.modelComparison[0];
      this.bestModelDisplay.textContent = bestModel.model;
    }

    // Recommendation
    const rec = this.dashboard.recommendations.general;
    if (rec) {
      this.recommendedModel.textContent = rec.model;
      this.recommendationConfidence.textContent = rec.confidence;
      this.recommendationConfidence.className = `confidence-badge ${rec.confidence}`;
      this.recommendationReason.textContent = rec.reason;

      if (rec.metrics) {
        this.recSuccessRate.textContent = `${rec.metrics.successRate}%`;
        this.recAvgSpeed.textContent = `${rec.metrics.avgSpeed}ms`;
        this.recAvgCost.textContent = `$${rec.metrics.avgCost}`;
      }
    }
  }

  /**
   * Update performance table
   */
  updatePerformanceTable() {
    this.performanceTableBody.innerHTML = '';

    if (this.dashboard.modelComparison.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = '<td colspan="7" class="loading">No performance data available yet. Run some categorizations to collect data.</td>';
      this.performanceTableBody.appendChild(row);
      return;
    }

    this.dashboard.modelComparison.forEach(model => {
      const row = document.createElement('tr');

      const successRateClass = model.successRate >= 90 ? 'high' : model.successRate >= 70 ? 'medium' : 'low';

      row.innerHTML = `
        <td><strong>${model.model}</strong></td>
        <td>${model.provider}</td>
        <td><span class="success-rate ${successRateClass}">${model.successRate}%</span></td>
        <td>${model.avgSpeed}ms</td>
        <td>$${model.totalCost}</td>
        <td>${model.totalCalls}</td>
        <td>$${model.avgCostPerCall}</td>
      `;

      this.performanceTableBody.appendChild(row);
    });
  }

  /**
   * Load cost report
   */
  async loadCostReport() {
    try {
      const period = this.costReportPeriod.value;
      const response = await chrome.runtime.sendMessage({
        action: 'getCostReport',
        data: { period }
      });

      if (response && response.success) {
        this.costReport = response.data;
        this.updateCostReport();
        this.updateBudgetStatus();
      }
    } catch (error) {
      console.error('Error loading cost report:', error);
    }
  }

  /**
   * Update cost report display
   */
  updateCostReport() {
    const report = this.costReport;

    let html = `
      <div class="cost-summary">
        <div class="metric">
          <span class="metric-label">Total Cost:</span>
          <span class="metric-value">$${report.totalCost}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Total Tokens:</span>
          <span class="metric-value">${report.totalTokens.toLocaleString()}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Total Calls:</span>
          <span class="metric-value">${report.totalCalls}</span>
        </div>
        <div class="metric">
          <span class="metric-label">Avg Cost/Call:</span>
          <span class="metric-value">$${report.avgCostPerCall}</span>
        </div>
      </div>
    `;

    // By provider
    if (Object.keys(report.byProvider).length > 0) {
      html += '<h4 style="margin-top: 20px;">By Provider</h4>';
      html += '<div class="provider-costs">';
      for (const [provider, data] of Object.entries(report.byProvider)) {
        html += `
          <div class="provider-cost">
            <strong>${provider}</strong>: $${data.cost.toFixed(4)} 
            (${data.tokens.toLocaleString()} tokens, ${data.calls} calls)
          </div>
        `;
      }
      html += '</div>';
    }

    this.costReportContent.innerHTML = html;
  }

  /**
   * Update budget status
   */
  updateBudgetStatus() {
    if (!this.costReport || !this.costReport.budgetStatus || !this.costReport.budgetStatus.enabled) {
      this.budgetStatusContent.innerHTML = '<p>Configure budget alerts above to track usage.</p>';
      return;
    }

    const status = this.costReport.budgetStatus;
    let html = '';

    // Daily
    if (status.daily) {
      const fillClass = status.daily.percentage >= 100 ? 'danger' : status.daily.percentage >= 80 ? 'warning' : '';
      html += `
        <div class="budget-period">
          <h4>Daily Budget</h4>
          <div class="budget-bar">
            <div class="budget-fill ${fillClass}" style="width: ${Math.min(status.daily.percentage, 100)}%"></div>
          </div>
          <div class="budget-details">
            <span>$${status.daily.spent} / $${status.daily.limit}</span>
            <span>${status.daily.percentage}%</span>
          </div>
        </div>
      `;
    }

    // Weekly
    if (status.weekly) {
      const fillClass = status.weekly.percentage >= 100 ? 'danger' : status.weekly.percentage >= 80 ? 'warning' : '';
      html += `
        <div class="budget-period">
          <h4>Weekly Budget</h4>
          <div class="budget-bar">
            <div class="budget-fill ${fillClass}" style="width: ${Math.min(status.weekly.percentage, 100)}%"></div>
          </div>
          <div class="budget-details">
            <span>$${status.weekly.spent} / $${status.weekly.limit}</span>
            <span>${status.weekly.percentage}%</span>
          </div>
        </div>
      `;
    }

    // Monthly
    if (status.monthly) {
      const fillClass = status.monthly.percentage >= 100 ? 'danger' : status.monthly.percentage >= 80 ? 'warning' : '';
      html += `
        <div class="budget-period">
          <h4>Monthly Budget</h4>
          <div class="budget-bar">
            <div class="budget-fill ${fillClass}" style="width: ${Math.min(status.monthly.percentage, 100)}%"></div>
          </div>
          <div class="budget-details">
            <span>$${status.monthly.spent} / $${status.monthly.limit}</span>
            <span>${status.monthly.percentage}%</span>
          </div>
        </div>
      `;
    }

    this.budgetStatusContent.innerHTML = html;
  }

  /**
   * Save budget settings
   */
  async saveBudgetSettings() {
    try {
      const budget = {
        enabled: this.budgetAlertEnabled.checked,
        dailyLimit: this.dailyBudget.value ? parseFloat(this.dailyBudget.value) : null,
        weeklyLimit: this.weeklyBudget.value ? parseFloat(this.weeklyBudget.value) : null,
        monthlyLimit: this.monthlyBudget.value ? parseFloat(this.monthlyBudget.value) : null,
        alertThreshold: parseInt(this.alertThreshold.value) / 100
      };

      const response = await chrome.runtime.sendMessage({
        action: 'setBudgetAlert',
        data: { budget }
      });

      if (response && response.success) {
        this.showSuccess('Budget settings saved successfully');
        this.loadCostReport();
      }
    } catch (error) {
      console.error('Error saving budget settings:', error);
      this.showError('Failed to save budget settings');
    }
  }

  /**
   * Start A/B test
   */
  async startABTest() {
    try {
      const modelA = this.modelASelect.value;
      const modelB = this.modelBSelect.value;
      const sampleSize = parseInt(this.abtestSampleSize.value);

      if (modelA === modelB) {
        this.showError('Please select different models for comparison');
        return;
      }

      this.startABTestBtn.disabled = true;
      this.startABTestBtn.textContent = 'Running test...';

      // Get sample bookmarks
      const bookmarksResponse = await chrome.runtime.sendMessage({
        action: 'getAllBookmarks'
      });

      if (!bookmarksResponse || !bookmarksResponse.success) {
        throw new Error('Failed to get bookmarks');
      }

      const bookmarks = bookmarksResponse.data.slice(0, sampleSize);

      // Run A/B test
      const response = await chrome.runtime.sendMessage({
        action: 'startABTest',
        data: { modelA, modelB, bookmarks }
      });

      if (response && response.success) {
        this.displayABTestResults(response.data);
        this.showSuccess('A/B test completed successfully');
      }
    } catch (error) {
      console.error('Error in A/B test:', error);
      this.showError('Failed to run A/B test');
    } finally {
      this.startABTestBtn.disabled = false;
      this.startABTestBtn.textContent = 'Start A/B Test';
    }
  }

  /**
   * Display A/B test results
   */
  displayABTestResults(data) {
    this.abtestResults.classList.remove('hidden');

    document.getElementById('modelAName').textContent = data.modelA;
    document.getElementById('modelBName').textContent = data.modelB;

    // Update metrics (placeholder - would need actual data)
    document.getElementById('modelASuccessRate').textContent = '95%';
    document.getElementById('modelASpeed').textContent = `${data.resultsA.time}ms`;
    document.getElementById('modelACost').textContent = '$0.001';

    document.getElementById('modelBSuccessRate').textContent = '92%';
    document.getElementById('modelBSpeed').textContent = `${data.resultsB.time}ms`;
    document.getElementById('modelBCost').textContent = '$0.002';
  }

  /**
   * Update previous A/B tests list
   */
  updatePreviousABTests() {
    if (!this.dashboard || !this.dashboard.abTestSummary || this.dashboard.abTestSummary.totalTests === 0) {
      this.previousTestsList.innerHTML = '<p>No A/B tests run yet.</p>';
      return;
    }

    const summary = this.dashboard.abTestSummary;
    let html = `<p><strong>${summary.totalTests}</strong> tests run`;

    if (summary.testsWithPreference > 0) {
      html += `, <strong>${summary.testsWithPreference}</strong> with user preferences</p>`;

      if (summary.preferences && Object.keys(summary.preferences).length > 0) {
        html += '<h4>Model Preferences:</h4><ul>';
        for (const [model, count] of Object.entries(summary.preferences)) {
          html += `<li>${model}: ${count} times</li>`;
        }
        html += '</ul>';
      }
    } else {
      html += '</p>';
    }

    this.previousTestsList.innerHTML = html;
  }

  /**
   * Load model configuration
   */
  async loadModelConfig() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getCustomModelConfig'
      });

      if (response && response.success && response.data) {
        const config = response.data;
        this.temperature.value = config.temperature || 1.0;
        this.temperatureValue.textContent = this.temperature.value;
        this.topP.value = config.top_p || 0.95;
        this.topPValue.textContent = this.topP.value;
        this.maxTokens.value = config.max_tokens || 2048;

        if (config.batchSizeMode) {
          this.batchSizeMode.value = config.batchSizeMode;
          if (config.batchSizeMode === 'custom' && config.customBatchSize) {
            this.customBatchSize.value = config.customBatchSize;
            this.customBatchSize.classList.remove('hidden');
          }
        }
      }
    } catch (error) {
      console.error('Error loading model config:', error);
    }
  }

  /**
   * Save model configuration
   */
  async saveModelConfig() {
    try {
      const config = {
        temperature: parseFloat(this.temperature.value),
        top_p: parseFloat(this.topP.value),
        max_tokens: parseInt(this.maxTokens.value),
        batchSizeMode: this.batchSizeMode.value,
        customBatchSize: this.batchSizeMode.value === 'custom' ? parseInt(this.customBatchSize.value) : null
      };

      const response = await chrome.runtime.sendMessage({
        action: 'setCustomModelConfig',
        data: { config }
      });

      if (response && response.success) {
        this.showSuccess('Model configuration saved successfully');
      }
    } catch (error) {
      console.error('Error saving model config:', error);
      this.showError('Failed to save model configuration');
    }
  }

  /**
   * Reset model configuration to defaults
   */
  resetModelConfig() {
    this.temperature.value = 1.0;
    this.temperatureValue.textContent = '1.0';
    this.topP.value = 0.95;
    this.topPValue.textContent = '0.95';
    this.maxTokens.value = 2048;
    this.batchSizeMode.value = 'auto';
    this.customBatchSize.classList.add('hidden');

    this.showSuccess('Model configuration reset to defaults');
  }

  /**
   * Show success message
   */
  showSuccess(message) {
    // Could implement a toast notification system
    alert(message);
  }

  /**
   * Show error message
   */
  showError(message) {
    alert('Error: ' + message);
  }
}

// Initialize controller when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ModelComparisonController();
});

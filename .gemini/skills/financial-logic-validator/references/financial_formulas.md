# Financial Formulas Reference

This document defines the mathematical models and formulas used in the Investment Simulation App.

## 1. Mean-Variance Optimization (MVO)

- **Expected Portfolio Return:** $E(R_p) = \sum_{i=1}^n w_i E(R_i)$
- **Portfolio Variance:** $\sigma_p^2 = \sum_{i=1}^n \sum_{j=1}^n w_i w_j \sigma_i \sigma_j ho_{ij}$
- **Sharpe Ratio:** $S = \frac{E(R_p) - R_f}{\sigma_p}$
  - $R_f$: Risk-free rate (assumed 0% unless specified)

## 2. Risk Parity

The goal is to find weights $w$ such that the Risk Contribution (RC) of each asset is equal.

- **Marginal Risk Contribution (MRC):** $	ext{MRC}_i = \frac{\partial \sigma_p}{\partial w_i} = \frac{(\Sigma w)_i}{\sqrt{w^T \Sigma w}}$
- **Risk Contribution (RC):** $	ext{RC}_i = w_i 	imes 	ext{MRC}_i$
- **Total Portfolio Risk:** $\sigma_p = \sum 	ext{RC}_i$

## 3. Monte Carlo Simulation (Geometric Brownian Motion)

- **Price Evolution:** $S_{t+\Delta t} = S_t \exp\left( (\mu - \frac{\sigma^2}{2})\Delta t + \sigma \epsilon \sqrt{\Delta t} ight)$
  - $\mu$: Annual drift (expected return)
  - $\sigma$: Annual volatility
  - $\epsilon$: Standard normal random variable $\sim N(0,1)$

# 数学笔记演示

这里是数学笔记的演示页面。

## 1. LaTeX 公式演示 (MathJax)

行内公式：我们考虑泛函 $J[y]$ 的极值问题。

块级公式（欧拉-拉格朗日方程）：

$$
\frac{\partial F}{\partial y} - \frac{d}{dx} \left( \frac{\partial F}{\partial y'} \right) = 0
$$

支持复杂符号（如希腊字母、积分）：

$$
J(y) = \int_{x_1}^{x_2} \sqrt{1 + (y')^2} \, dx
$$

## 2. 逻辑流程图演示 (Mermaid)

这是语雀也支持的功能，用代码画图：

```mermaid
graph TD
    A[实际问题] -->|建模| B(泛函 J)
    B --> C{求变分 delta J}
    C -->|delta J = 0| D[Euler-Lagrange 方程]
    D --> E[微分方程求解]
    E --> F[极值曲线]
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1BBO_HVkmomPgI-TO0OHa3oxM-pn3-3GF

## Run Locally

**Prerequisites:** Node.js

### 配置说明

1. **安装依赖：**
   ```bash
   npm install
   ```

2. **配置API密钥（重要）：**
   - 在项目根目录创建 `.env.local` 文件
   - 添加以下内容：
     ```
     VITE_GEMINI_API_KEY=你的真实API密钥
     ```
   - **重要说明：**
     - 必须使用 `VITE_` 前缀，Vite才能在浏览器中暴露该环境变量
     - 文件名必须是 `.env.local`（会被 `.gitignore` 忽略，不提交到版本控制）
     - 重启开发服务器后环境变量才会生效

3. **启动应用：**
   ```bash
   npm run dev
   ```

### 环境变量说明

- API密钥通过 `process.env.API_KEY` 在代码中访问
- Vite会自动将 `.env.local` 文件中的环境变量注入到构建过程中

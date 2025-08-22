## Step-by-Step Setup Instructions

Make sure you have v22.18.0 of node installed on your system to avoid incompatibility errors.

Need to use ^3.4.3 version of tailwind css for this project. Latest version was found to be unstable while creating this project.

**IMPORTANT:** 

USE MY PACKAGE.JSON SINCE IT HAS ALL THE NECESSARY VERSIONS FOR CORRECT WORKING OF THE CODE.

### 1. Create a New React Application

First, create a new React project using Vite. Open your terminal and run the following command:

```bash
npm create vite@latest cryptopulse-app -- --template react
```

### 2. Navigate to the Project Directory

Change your directory to the newly created project folder:

```bash
cd cryptopulse-app
```

**Install all dependencies:**

    ```bash
    npm install
    ```

### 3. Install Tailwind CSS

Next, install Tailwind CSS and its peer dependencies, then generate the configuration files.

```bash
npm install @tailwindcss/postcss postcss autoprefixer
```
### 4. Configure Tailwind CSS

You now need to configure Tailwind to scan your project files and enable dark mode.

**A) Create `tailwind.config.js`:** in root directory
Open the `tailwind.config.js` file and replace its content with the following:

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

**B) Create `postcss.config.js`:** in root directory

Open the `postcss.config.js` file and replace its content with the following:

export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

**C) Edit `src/index.css`:**
Open the `src/index.css` file, delete all of its existing content, and add these three lines:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 5. Install Additional Dependencies

Install the libraries needed for charting and advanced UI components.

```bash
npm install react-chartjs-2 chart.js @headlessui/react
```

### 6. Update the Main HTML File

Open the `index.html` file in the root of your project. Add the CDN links for Font Awesome (for icons) and the "Inter" Google Font inside the `<head>` section after the meta tags.

```html
<head>
  <!-- ... other meta tags ... -->
  <title>CryptoPulse - Live Price Tracker</title>

  <!-- Add these lines -->
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
</head>
```

### 7. Add the Application Source Code

At this point, the project environment is fully configured. Now, add the application's source code:

1.  **Delete the boilerplate files:** `src/App.css` and any files inside `src/assets`.

2.  Create a new file named **`src/CoinDetailModal.jsx`**.

3.  Copy the complete code for the `CoinDetailModal.jsx` file and paste it into this new file.

4. Open the existing **`src/App.jsx`** file, delete all of its content, and paste the complete code of the `App.jsx` into it.

### 8. Run the Application

 ```bash
    npm run dev
    ```

The terminal will display a local URL (e.g., `http://localhost:5173`). Open this URL in your web browser to view the running application.

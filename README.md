FileShare - Secure File Uploader

Description
-----------
FileShare is a simple web application for securely uploading and sharing files using the Telegram Bot API. It allows users to upload files up to 50MB, retrieve download URLs, and copy URLs easily.

### Code Snippet JavaScript 
```js
const fetch = require('node-fetch');
const FormData = require('form-data');
const { fromBuffer } = require('file-type');
const cheerio = require('cheerio');

/**
* Upload image to url
* Supported mimetype:
* - `image/jpeg`
* - `image/jpg`
* - `image/png`
* - `video/mp4`
* - `all files`
* @param {Buffer} buffer Image Buffer
*/

module.exports = async (buffer) => {
  let { ext } = await fromBuffer(buffer);
  const bodyForm = new FormData();
  bodyForm.append("file", buffer, "file." + ext);
  
  const response = await fetch("https://uptele.onrender.com/api/upload", {
    method: "POST",
    body: bodyForm,
  });

  const html = await response.text();
  const $ = cheerio.load(html);
  const resultUrl = $('input.highlight-url').first().val();

  return resultUrl
}
```


Features
--------
- File Upload: Supports all file types up to 50MB.
- Download URLs: Each uploaded file gets a unique download URL.
- Responsive Design: User-friendly interface for both desktop and mobile devices.
- Security: Telegram token stored in `.env` to prevent leaks.

Prerequisites
-------------
- Node.js (version 18 or higher)
- npm
- Telegram account with a Bot Token and Chat ID

Installation
------------
1. Clone this repository:
```sh
   git clone https://github.com/hostinger-bot/uploader
   cd uploader
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Create a `.env` file in the project root and add your Telegram Bot Token and Chat ID:
   ```sh
   TELEGRAM_TOKEN=your-telegram-bot-token
   TELEGRAM_CHAT_ID=your-chat-id
   ```
4. Run the application in development mode:
   ```sh
   npm start
   ```

5. For a production build:
   ```sh
   npm run build
   ```
   Note: Build files will be saved in the `dist` folder.
   
6. For dev run
   ```sh
   npm run dev
    ```
  
7. Access the application in your browser:
   http://localhost:3000
   
9. Type `/start` or something on your bot  

Dependencies
------------
- express: Web framework for Node.js.
- multer: Middleware for handling file uploads.
- axios: For making HTTP requests to the Telegram API.
- form-data: For uploading files to Telegram.
- sanitize-filename: To ensure safe file names.
- pug: Template engine for rendering HTML.
- express-rate-limit: To limit request rates.
- morgan: For HTTP request logging.
- dotenv: To load environment variables from `.env`.

Notes
-----
- Telegram Limitations: The Bot API has a 50MB file size limit. For files up to 2GB, you need to run a local Bot API server.
- Security: Never commit the `.env` file to a public repository. Ensure `.env` is listed in `.gitignore`.
- Production Build: The `dist` folder is included in Git for easy deployment. Run `npm run build` before deploying.

Contributing
------------
1. Fork this repository.
2. Create a feature branch:
   git checkout -b feature/feature-name
3. Commit your changes:
   git commit -m "Add feature-name feature"
4. Push to your branch:
   git push origin feature/feature-name
5. Create a Pull Request on GitHub.

License
-------
MIT License. See LICENSE file for details.

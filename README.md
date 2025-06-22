# 💬 Real-Time Chat Website

This is a real-time chat web application where users can:

- Sign up and log in
- Create or join existing chat rooms
- Chat with other users in the same room
- View all participants in a room

---

## 🚀 Features

- ✅ User authentication (Login/Signup)
- 🏠 Create new rooms or join existing ones
- 👥 View list of all participants in a room
- 💬 Real-time chat using Socket.io

---

## 🛠 Technologies Used

- **Node.js** – Server-side JavaScript runtime
- **Express.js** – Web application framework
- **MongoDB** – NoSQL database for storing user and room data
- **Socket.io** – For real-time communication
- **HTML/CSS/JavaScript** – Frontend

---

## 📁 Project Structure

```
chat-website/
├── server.js
├── package.json
├── .env
├── public/
│   ├── index.html
│   ├── room.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       └── script.js
├── models/
│   └── User.js
├── routes/
│   └── auth.js
└── utils/
    └── roomManager.js
```

---

## 📦 Installation & Setup

Follow these steps to run the project locally:

### 1. Clone the repository

```bash
git clone https://github.com/kanjiyapalak/chat-website.git
cd chat-website
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create `.env` file

In the root directory, create a `.env` file and add the following:

```env
MONGO_URI=your_mongodb_connection_string
PORT=3000
```

Replace `your_mongodb_connection_string` with your actual MongoDB URI.

### 4. Start the server

```bash
npm start
```

Now open your browser and go to:  
👉 `http://localhost:3000`

---

## 🖥️ How to Use

1. Visit `http://localhost:3000`
2. Sign up or log in with your account
3. Create a new chat room or enter an existing room ID
4. Chat with other users in real-time
5. See who else is currently in the room

---

## 📸 Screenshots

![{058E1A1E-F081-479F-8AF4-7B57ECCFA6D7}](https://github.com/user-attachments/assets/ea2aeb0a-784b-4b53-84af-aca10042e17c)
![{A2E2E8F9-6796-4178-9444-E119867DAA2A}](https://github.com/user-attachments/assets/7bbae3de-35af-451c-8384-71eb1f5141ba)
![{9CEAB1D5-DE2A-4A25-975D-DFEF597CF426}](https://github.com/user-attachments/assets/8110a6a3-9271-498a-abe4-e3d338889e46)




![{42554B4E-558E-4AFB-92E3-340466BCD18B}](https://github.com/user-attachments/assets/bab74e3f-4443-496a-897f-aab68af3eaae)
![{12D03155-A71E-4B15-9452-C568BBD9ACE8}](https://github.com/user-attachments/assets/14ea7a0d-b60c-483d-b245-7404bae28350)


---

## 🔐 Security

- Passwords are securely hashed using **bcrypt**
- MongoDB stores user and room data
- Rooms are uniquely identified to avoid overlap

---





## 📃 License

This project is licensed under the **MIT License**.

---

## 📬 Contact

**Created by:** kanjiya palak
📧 kanjiyapalak@gmail.com 
🔗 GitHub: [https://github.com/kanjiyapalak](https://github.com/kanjiyapalak)

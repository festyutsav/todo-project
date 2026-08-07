# Todo App

A modern todo application built with HTML, CSS, and Vanilla JavaScript.

I created this project to strengthen my frontend fundamentals without relying on frameworks. Along with building the core todo functionality, I wanted to explore how thoughtful UI design and subtle animations can make a simple application feel more polished. To achieve that, I experimented with glassmorphism, GSAP animations, and a lightweight Three.js background while keeping the application responsive and easy to understand.

---

## Live Demo

Coming soon

---

## Preview

> Screenshots and demo GIF will be added after deployment.

---

## Features

- Create, edit, complete, and delete tasks
- Search tasks instantly
- Filter tasks by status
- Sort tasks by priority
- Task persistence using browser localStorage
- Responsive layout for desktop and mobile
- Smooth interface animations with GSAP
- Lightweight animated background using Three.js
- Confetti animation when all tasks are completed

---

## Tech Stack

- HTML5
- CSS3
- JavaScript (ES6)
- Three.js
- GSAP

---

## Project Structure

```text
todo-project/
│
├── index.html
├── README.md
│
├── src/
│   ├── css/
│   │   └── style.css
│   │
│   └── js/
│       ├── script.js
│       └── three-bg.js
│
└── assets/
```

---

## Running the Project

Clone the repository

```bash
git clone https://github.com/your-username/todo-project.git
```

Move into the project directory

```bash
cd todo-project
```

Start a local server

```bash
python3 -m http.server 8000
```

Open

```text
http://localhost:8000
```

---

## What I Learned

Building this project gave me hands-on experience with:

- DOM manipulation
- Event handling
- Working with browser localStorage
- Organizing JavaScript into reusable functions
- Responsive layout design
- Adding animations without affecting usability
- Integrating third-party libraries into a Vanilla JavaScript project

---

## Challenges

One of the main goals was to improve the visual experience without making the application feel heavy. I wanted the background animation to complement the interface instead of becoming a distraction, so I kept the Three.js scene lightweight and focused on subtle motion throughout the application.

---

## Future Improvements

Some features I would like to add in the future:

- Drag and drop task ordering
- Due dates and reminders
- Dark and light theme switch
- Task categories
- Keyboard shortcuts
- Progressive Web App (PWA) support

---

## Acknowledgements

AI-assisted tools were used during development to explore animation ideas, understand implementation approaches, and speed up experimentation. The project architecture, application logic, debugging, UI decisions, and overall implementation were completed as part of my learning process.

---

## License

This project is licensed under the MIT License.
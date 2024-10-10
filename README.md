# ShowTime AI Companion

## Overview

The AI Companion project is designed to provide users with a virtual assistant capable of handling various tasks, including chat and speech recognition. It leverages Google Cloud Platform (GCP) for deployment and utilizes GitHub Actions for continuous integration and delivery (CI/CD).

## Architecture

The project is structured around a Node.js backend, utilizing Express.js for the server framework and Socket.IO for real-time communication between the client and server. The backend is responsible for handling chat and speech processing, user authentication, and interaction with external APIs.

## Key Components

Express.js Server: Serves the application and handles API requests.
Socket.IO: Manages real-time communication between clients and the server.
Passport.js: Used for authentication, specifically with JWT for securing endpoints.
Google Cloud Platform (GCP): Hosts the application, providing scalability and reliability.
GitHub Actions: Automates the CI/CD pipeline, facilitating automatic deployment to GCP on code changes.

## Features

Chat Functionality: Users can send text messages to the AI companion, receiving intelligent responses.
Speech Recognition: The application can process spoken input from users, converting it to text for processing.
Text-to-Speech: Converts text responses from the AI into spoken words, enhancing the user experience.
Authentication: Secure user authentication mechanism using JWT, ensuring data protection and privacy.
Real-time Interaction: Utilizes WebSocket communication for instant interaction between the user and the AI companion.
Deployment
The project is deployed on Google Cloud Platform, leveraging services such as Compute Engine for running the application instances and Cloud Storage for data persistence.

## CI/CD Pipeline

Code Pushed to GitHub: Developers push code changes to the repository.
GitHub Actions Triggered: A series of automated workflows are triggered, including linting, testing, and building the application.
Deployment to GCP: If all steps in the pipeline succeed, the application is automatically deployed to GCP, ensuring that the latest version is always available.
Development Setup
Clone the Repository: Start by cloning the project repository from GitHub.
Install Dependencies: Run npm install to install the required Node.js packages.
Environment Variables: Set up the necessary environment variables, including those for GCP credentials and application configuration.
Local Development Server: Use npm start to run the application locally for development purposes.
Contributing
Contributions to the AI Companion project are welcome. Developers are encouraged to contribute by submitting pull requests with new features, bug fixes, or performance improvements.

## Guidelines

Code Style: Follow the established coding conventions and guidelines.
Testing: Ensure that all new features or changes are accompanied by relevant tests.
Documentation: Update the documentation accordingly to reflect any changes or additions to the project.
Security
Security is a top priority in the AI Companion project. Ensure that all communication is encrypted, dependencies are kept up-to-date, and access controls are properly implemented.

## TODOs

- [✔️] Weather API integration (OpenWeatherMap)
- [✔️] Google Search API integration
- [ ] Browsing Website
- [ ] Message queue for communication between the AI and the user
- [ ] Long term memory for the AI companion, such as rolling window summarization of the conversation(now it's just a window of 5 turn of conversation)

# FlashcardAI – Spaced Repetition Learning Platform

## Overview

FlashcardAI is a client-side web application designed to help users create, manage, and study flashcards using an adaptive spaced repetition system. The platform implements the SM-2 scheduling algorithm to optimize long-term retention and learning efficiency.

The application supports structured organization through Subjects and Decks, and allows users to generate, edit, review, and analyze flashcards in a structured study workflow.

This project demonstrates frontend architecture, state management, algorithm implementation, and modular UI design using modern web technologies.

---

## Features

### Authentication
- Client-side authentication flow
- Protected routes
- Session persistence using local storage

### Subject & Deck Management
- Create, rename, and delete subjects
- Create, rename, and delete decks within subjects
- Cascade removal of associated decks and cards

### Flashcard Management
- Add flashcards manually
- Import flashcards via text or PDF
- Edit and delete flashcards
- Organize flashcards under specific decks

### Study Mode
- SM-2 spaced repetition scheduling algorithm
- Keyboard shortcuts for faster review
- Dynamic interval adjustment based on recall quality
- Automatic scheduling of next review date
- Session progress tracking

### Analytics
- Total cards count
- Due cards tracking
- Review statistics
- Accuracy percentage
- Reviews per day visualization

### Export / Import
- JSON export of subjects, decks, and cards
- JSON import with validation

### UI
- Responsive layout
- Dark and light mode support
- Structured dashboard interface
- Clean SaaS-style design

---

## Tech Stack

### Frontend
- React
- Vite
- TypeScript
- Tailwind CSS

### Storage
- IndexedDB (via localForage)

---

## Architecture

### Data Model

**Subject**
- id
- name

**Deck**
- id
- subjectId
- name
- createdAt

**Card**
- id
- subjectId
- deckId
- front
- back
- reviewState
  - interval
  - repetition
  - easeFactor
  - due
- createdAt

All data is stored locally in the browser using IndexedDB.

---

## SM-2 Scheduling Algorithm

The application implements the SuperMemo-2 (SM-2) spaced repetition algorithm. Each flashcard stores:

- interval (days until next review)
- repetition count
- ease factor
- due timestamp

Based on user feedback (quality score 1–5), the system dynamically adjusts review intervals to optimize retention while minimizing unnecessary repetition.

This mirrors the scheduling strategy used in tools like Anki and SuperMemo.

---

## Project Structure

- Pages: Dashboard, Study, Create/Import, Analytics, Auth
- Reusable UI components
- Storage service layer
- Auth context
- Scheduler logic module

---

## Learning Objectives

This project demonstrates:

- Frontend architecture using React and TypeScript
- State management and modular design
- Implementation of the SM-2 scheduling algorithm
- IndexedDB integration for persistent local storage
- Protected routing and session handling
- Structured UI design with Tailwind CSS
- Data visualization with charts
- Clean and maintainable project organization

---

## Future Improvements

- Multi-device synchronization
- Optional backend integration
- Collaborative deck sharing
- Progressive Web App support
- Performance optimization for large datasets
- Enhanced analytics

---

## License

This project is for educational and portfolio purposes.

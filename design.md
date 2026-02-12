# Math Practice App - Design Plan

## Overview
A mobile math practice app for learning basic arithmetic operations (addition, subtraction, multiplication, division). The app presents randomly generated problems with manual input, animated feedback, and progress tracking.

## Brand Identity
- **Primary Color**: #B6FFFB (bright cyan)
- **Secondary Color**: Black (#000000)
- **App Name**: Math Practice
- **Style**: Clean, minimal, educational, iOS-native feel

## Screen List

### 1. Operation Selection Screen
**Purpose**: Choose which arithmetic operation(s) to practice

**Content**:
- App title/logo at top
- Four operation cards: Addition (+), Subtraction (−), Multiplication (×), Division (÷)
- "Select All" button
- "Start Practice" button (enabled when at least one operation selected)

**Layout**:
- Portrait orientation (9:16)
- Top third: Title and logo
- Middle: 2×2 grid of operation cards
- Bottom: Action buttons

### 2. Practice Screen
**Purpose**: Display problems and collect answers

**Content**:
- Progress indicator (e.g., "Question 5 of 50")
- Score display (e.g., "Score: 12/15")
- Problem display (large, centered, e.g., "5 × 4 =")
- Number input area (bottom half of screen)
- Submit button

**Layout**:
- Top: Progress bar + score
- Upper middle: Problem display (large text)
- Lower half: Numeric keypad (0-9, backspace, submit)

**Interactions**:
- Tap numbers to build answer
- Backspace to delete
- Submit to check answer
- Animate problem area green (correct) or red (incorrect)
- Brief pause, then load next problem

### 3. Results Screen
**Purpose**: Show session summary

**Content**:
- Total score (e.g., "45/50 Correct!")
- Percentage (e.g., "90%")
- Breakdown by operation (if multiple selected)
- "Practice Again" button
- "Change Operations" button

**Layout**:
- Top: Large score display
- Middle: Statistics cards
- Bottom: Action buttons

## Key User Flows

### Flow 1: Start Practice Session
1. User opens app → Operation Selection Screen
2. User taps operation cards (highlights selected)
3. User taps "Start Practice" → Practice Screen
4. App generates 50 random problems for selected operations

### Flow 2: Answer Problem
1. User sees problem (e.g., "7 × 8 =")
2. User taps numbers on keypad to build answer (e.g., "56")
3. User taps Submit
4. App checks answer:
   - **Correct**: Problem area flashes green, score increments, next problem loads
   - **Incorrect**: Problem area flashes red, score stays same, next problem loads
5. Repeat until 50 problems completed → Results Screen

### Flow 3: Complete Session
1. After 50th problem, app navigates to Results Screen
2. User sees final score and statistics
3. User taps "Practice Again" → new session with same operations
4. OR User taps "Change Operations" → Operation Selection Screen

## Color Choices
- **Primary Action**: #B6FFFB (cyan) - for selected states, primary buttons
- **Background**: White (light mode), #151718 (dark mode)
- **Text**: Black (light mode), #ECEDEE (dark mode)
- **Correct Feedback**: #22C55E (green)
- **Incorrect Feedback**: #EF4444 (red)
- **Cards/Surfaces**: #F5F5F5 (light mode), #1E2022 (dark mode)

## Typography
- **Problem Display**: 48-56px, bold, centered
- **Progress/Score**: 16-18px, medium weight
- **Buttons**: 18-20px, semibold
- **Keypad Numbers**: 32-36px, medium

## Animations
- **Correct Answer**: Scale problem area slightly (1.0 → 1.05 → 1.0) with green background fade
- **Incorrect Answer**: Shake problem area horizontally with red background fade
- **Transitions**: Smooth fade between screens (200-300ms)

## Problem Generation Rules
- **Multiplication**: 1-12 × 1-12
- **Addition**: 1-99 + 1-99
- **Subtraction**: 1-99 − 1-99 (result always positive)
- **Division**: Only problems with whole number answers, divisors 1-12
- **Random**: No repeating problems in same session

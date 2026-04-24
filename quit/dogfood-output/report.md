# Dogfood Session Report

**Target URL:** `http://localhost:5173`
**Date:** 2026-04-23
**Scope:** Full app

## Executive Summary

**Total Issues Found:** 1
**Critical:** 1 | **High:** 0 | **Medium:** 0 | **Low:** 0

The application currently has a critical blocker preventing user login. The backend API is failing to connect to the MySQL database (ECONNREFUSED on port 3306), causing a 500/Network Error on the frontend when attempting to authenticate. Because of this blocker, no other authenticated sections of the app could be tested.

---

## Issues

### ISSUE-001: Critical - Login fails with "Network Error" due to Backend Database Connection Refusal

**Severity:** Critical
**Category:** Functional
**Repro Video:** N/A (Consistently fails on first attempt)

**Description:**
When attempting to log in on the `/login` page with valid credentials (`admin` / `admin123`), the frontend displays a "登录失败" (Login failed) error message. Checking the browser network requests reveals a "Network Error" on the POST request to `http://localhost:3000/api/users/login`. 
Upon checking the backend service logs, it throws a `connect ECONNREFUSED ::1:3306` error because the MySQL database is not running or accessible. This completely blocks users from accessing the WMS system.

**Repro Steps:**
1. Navigate to `http://localhost:5173/login`.
2. Enter `admin` in the Username field.
3. Enter `admin123` in the Password field.
4. Click the "登录" (Login) button.
5. Observe the "登录失败" error message on the screen and the Network Error in the console.

**Evidence:**
- Final state screenshot: `screenshots/issue-001-result.png`
- Backend error log snippet:
```
登录失败: AggregateError:
  code: 'ECONNREFUSED',
  [errors]: [
    Error: connect ECONNREFUSED ::1:3306
  ]
```

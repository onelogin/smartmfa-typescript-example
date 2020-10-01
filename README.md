# OneLogin Smart MFA TypeScript Example

## Introduction

This is a TypeScript example of how one would integrate OneLogin Smart MFA features into their product.

## Requirements

A [OneLogin Developer Account](https://www.onelogin.com/developer-signup?utm_medium=web&utm_source=devsite&utm_campaign=freedeveloperaccount&utm_content=headernav)
NodeJS 10 or higher
TypeScript

## Setup

### From an Unconfigured Developer Account

1. Create a [developer account](https://www.onelogin.com/developer-signup?utm_medium=web&utm_source=devsite&utm_campaign=freedeveloperaccount&utm_content=headernav)
2. Log in as the admin and from the top nav bar select Developers > API Credentials then New Credential
3. Follow the steps in the form to create a credential with Manage All permission
4. From the top bar select Security > Authentication Factors then choose a factor
5. From the top bar select Security > Policies then New User Policy
6. Give it a name then under MFA in the left rail  check "OTP Auth Required" and at the bottom of this view check "Suppress if risk is equal to or lesser than" and select a value from the dropdown
7. Follow the Getting Started instructions below to set up the Login With Smart MFA example service

## Getting Started

### With Docker

1. Clone this repository.
2. Create a `.env` file and addd your OneLogin API credentials. See `.env_example` for an example.
3. Run `docker-compose build` to build, then `docker-compose up` to start.

Default mode is dev mode as defined in the Dockerfile `CMD [ "npm", "run", "dev" ]`.
You may change this to `CMD [ "npm", "run", "start" ]` to run in prod mode.

### With Node/NPM

1. Clone this repository.
2. Run `npm run build` to ensure the build works then `npm run dev` to start in dev mode.

You may also run `npm run start` for prod mode.

## Usage

### Sign Up a New User

```bash
curl -X POST localhost:8080/auth/signup -H "Content-Type: application/json" -d'{
  "user_identifier": "<some username>",
  "password": "some_password"
  "phone": "+15551234567 <a phone on which you can recieve sms messages>",
  "context": {
    "ip": "<your ip>",
    "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36"
  }
}'
```

### Log In As a User

```bash
curl -X POST localhost:8080/auth/login -H "Content-Type: application/json" -d'{
  "user_identifier": "<some username>",
  "password": "some_password"
  "phone": "+15551234567 <a phone on which you can recieve sms messages>",
  "context": {
    "ip": "<your ip>",
    "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36"
  }
}'
```

### Verify the OTP

```bash
curl -X POST localhost:8080/auth/otp -H "Content-Type: application/json" -d'{  
"otp_token": "<code you got on phone>",
"state_token": "<state_token from login/signup response>"
}'
```

## Spot an Error?

If you see an error here or in the code, feel free to open an issue here and/or submit a PR.

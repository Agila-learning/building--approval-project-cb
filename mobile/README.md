# CB Building Approvals - Mobile Android Application (Expo React Native)

A native Android mobile application for **CB Building Approvals & Civil Clearances**, built using React Native with Expo and TypeScript.

This mobile application is built in the `mobile/` directory and reuses the existing backend APIs, MongoDB database, Cloudinary document storage, and authentication workflows without modifying the existing web application.

---

## 📱 Features & Highlights

- **Direct-to-Login Launch**: When opened, the app routes straight to the branded Login screen (no public landing page).
- **Exact Brand Identity**: Custom Ivory (`#F7F4EE`), Deep Blue (`#022F94`), Primary Blue (`#1044C4`), Gold (`#D6A756`), and Red accent system matching the web application.
- **Role-Based Navigation**:
  - **Admin**: Dashboard metrics, Live Application management, Add Application wizard, Application Detail & Status update, Customer Leads, Staff Management, Attendance Log, and Financial Reports.
  - **Employee / Field Staff**: Assigned tasks & applications, progress reviewer, and mobile check-in attendance tracker.
  - **Citizen / Customer**: Reference-based approval tracking with visual status stepper and direct document uploads.
- **Native Document Uploads**:
  - Direct integration with camera (`expo-image-picker`) and file manager (`expo-document-picker`).
  - Directly uploads files to Cloudinary (`dfou7lxtg`) and attaches secure URLs to MongoDB application records.
- **Secure Authentication**:
  - Tokens persisted natively with `expo-secure-store`.
  - Automatic session restore and role authorization routing.

---

## 🛠️ Project Architecture

```
mobile/
├── app/
│   ├── _layout.tsx                     # Root Stack with AuthProvider
│   ├── index.tsx                       # Initial redirect to /login
│   ├── login.tsx                       # Branded direct login screen
│   ├── (admin)/                        # Admin portal
│   │   ├── _layout.tsx                 # Admin Bottom Tabs
│   │   ├── index.tsx                   # Admin Dashboard & KPIs
│   │   ├── applications.tsx            # Filterable Applications List
│   │   ├── application-detail.tsx      # Details, Status Modal & Docs
│   │   ├── new-application.tsx         # Multi-step creation form
│   │   ├── customers.tsx               # Customer Leads directory
│   │   ├── staff.tsx                   # Staff list & Add Member modal
│   │   ├── attendance.tsx              # Attendance log & Daily check-in
│   │   └── reports.tsx                 # Financial & case breakdown
│   ├── (employee)/                     # Employee portal
│   │   ├── _layout.tsx                 # Staff Bottom Tabs
│   │   ├── index.tsx                   # Assigned tasks dashboard
│   │   ├── applications.tsx            # Staff applications manager
│   │   └── attendance.tsx              # Staff attendance check-in
│   └── (customer)/                     # Citizen portal
│       ├── _layout.tsx                 # Citizen Bottom Tabs
│       ├── index.tsx                   # Application tracker with stepper
│       └── upload.tsx                  # Required document uploader
├── components/                         # Header, StatusBadge, Cards
├── constants/                          # Theme (Colors, Spacing, Radius)
├── contexts/                           # AuthContext (SecureStore token sync)
├── services/                           # API, Application, Upload services
├── types/                              # Full TypeScript models
├── assets/                             # Brand logos, icons, splash
├── app.json                            # Expo & Android permissions config
├── eas.json                            # EAS Build profiles (APK & AAB)
└── .env.example                        # Safe environment template
```

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env`:

```env
EXPO_PUBLIC_API_URL=https://building-approval.onrender.com/api
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=dfou7lxtg
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=ml_default
```

---

## 🚀 Running the App Locally

1. **Navigate to the mobile directory**:
   ```bash
   cd mobile
   ```

2. **Start Expo Dev Server**:
   ```bash
   npx expo start
   ```

3. **Run on Android device or emulator**:
   - Press `a` in the terminal to open in connected Android emulator.
   - Or scan the QR code with Expo Go on your Android phone.

---

## 📦 How to Generate the Installable Android APK

This project is configured with `eas.json` to generate an installable standalone Android APK (`.apk` file) via Expo Application Services (EAS).

### Step 1: Install EAS CLI and Log In
```bash
cd mobile
npx eas-cli@latest login
```
*(Enter your free Expo account credentials)*

### Step 2: Configure Project ID (One-time)
```bash
npx eas-cli@latest project:init
```

### Step 3: Run the APK Build Command
Execute the preview profile build command:
```bash
npx eas-cli@latest build --platform android --profile preview
```

### Step 4: Download and Install
- EAS Build will compile the native Android bundle in the cloud and return a direct download link (e.g. `https://expo.dev/artifacts/eas/...apk`).
- Download the `.apk` directly onto your Android phone and install it.

---

## 🔍 Validation Checks Passed
- **TypeScript**: `npx tsc --noEmit` passed with 0 errors.
- **Expo Doctor**: `21/21` diagnostics passed with 0 warnings.
- **Metro Bundler Production Export**: `npx expo export --platform android` completed successfully.

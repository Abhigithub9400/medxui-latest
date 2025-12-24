// @ts-ignore
import { PhoneNumberUtil } from "google-libphonenumber";

interface DobErrors {
  invalidDateFormat: boolean;
  invalidAge: boolean;
  futureDate: boolean;
  blankDob: boolean;
}

interface AgreementInteraction {
  agreeTerms: boolean;
  agreeLicense: boolean;
}

export const validateLoginEmail = (email: string): string => {
  const trimmed = email.trim();

  const safePattern = new RegExp(
    "^" +
      // local part: 1 to 64 chars, starts and ends with alnum, dots/underscores/hyphens allowed inside
      "[A-Za-z0-9]" +
      "(?:[A-Za-z0-9._-]{0,62}[A-Za-z0-9])?" +
      "@" +
      // domain: one or more labels separated by dot
      // each label: starts/ends with alnum, up to 63 chars, hyphens allowed inside
      "(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\\.)+" +
      // TLD: at least 2 letters
      "[A-Za-z]{2,}" +
    "$"
  );

  if (!trimmed) return "Email is required.";
  if (!safePattern.test(trimmed)) return "Enter a valid email address.";
  return "";
};


export const validatePassword = (password: string): string => {
  if (!password) return "Password is required.";
  if (password.length < 8)
    return "Password must be at least 8 characters long.";
  return "";
};

export const validateEmailFormat = (emailToValidate: string): string => {
  const email = (emailToValidate || "").trim();

  // A safer, bounded, anchored regex:
  // - overall length limited with lookahead (?=.{6,254}$)
  // - local part pieces limited to 1..64 characters and dot-separated
  // - domain labels follow RFC-like rules (start/end with alnum, hyphen allowed inside)
  // - TLD requires at least 2 letters
  // This form avoids nested unbounded quantifiers that can cause catastrophic backtracking.
  const safeEmailRegex = /^(?=.{6,254}$)([A-Za-z0-9!#$%&'*+/=?^_`{|}~-]{1,64}(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]{1,64})*)@(?:(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+)([A-Za-z]{2,})$/;

  const disposableProviders = [
    "yopmail.com",
    "mailinator.com",
    "guerrillamail.com",
    "10minutemail.com",
    "aol.com",
    "example.com",
    "a.com",
    "test.com",
  ];

  if (!email) {
    return "Email field cannot be left blank. Please enter your email.";
  }

  // Fast fail: basic presence and @ (cheap checks before regex)
  const atIndex = email.lastIndexOf("@");
  if (atIndex <= 0 || atIndex === email.length - 1) {
    return "Please enter a valid email address.";
  }

  const localPart = email.slice(0, atIndex);
  if (localPart.length < 6 || localPart.length > 64) {
    // local part length restriction (RFC allows up to 64, but you had 6..30 originally;
    // 6..64 is more permissive while avoiding pathological lengths)
    return "The username must be between 6 and 64 characters long.";
  }

  // Use the safe regex for full validation
  if (!safeEmailRegex.test(email)) {
    return "Please enter a valid email address.";
  }

  // Extract canonical domain (lowercased) and check disposable providers.
  // Use endsWith so subdomains like "mail.mailinator.com" are caught.
  const domain = email.slice(atIndex + 1).toLowerCase();

  if (disposableProviders.some((d) => domain === d || domain.endsWith(`.${d}`))) {
    return "The email domain is not allowed. Please use a valid provider.";
  }

  return "";
};


export const validateNewPassword = (password: string): string => {
  if (!password) {
    return "Password is required.";
  } else if (password.length < 8) {
    return "Password must be at least 8 characters long.";
  } else if (!/[A-Z]/.test(password)) {
    return "Password must include at least one uppercase letter.";
  } else if (!/[a-z]/.test(password)) {
    return "Password must include at least one lowercase letter.";
  } else if (!/\d/.test(password)) {
    return "Password must include at least one digit.";
  } else if (!/[!@#$%^&*(),.?":{}|<>_+\-=\\`~[\]'/;]/.test(password)) {
    return "Password must include at least one special character.";
  }
  return "";
};

export const validateConfirmPassword = (
  password: string,
  confirmPassword: string
): string => {
  if (!confirmPassword) {
    return "Please confirm your password.";
  } else if (confirmPassword !== password) {
    return "Passwords do not match. Please try again.";
  }
  return "";
};

export const validateTitle = (title: string): string => {
  if (!title) return "Title is required.";
  return "";
};


export const validateName = (name: string): string => {
  const trimmedName = name.trim();
  const namePattern = /^[A-Za-z\s.]+$/;

  if (!trimmedName) {
    return "Name is required.";
  } else if (!namePattern.test(trimmedName)) {
    return "Name must contain only alphabetic characters.";
  } else if (trimmedName.length < 3) {
    return "Name must be at least 3 characters long.";
  }

  return "";
};


export const validatePatientId = (id: string): boolean => {
  const cleaned = id.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return /^[A-Z0-9]{3,}$/.test(cleaned);
};


export const validateGender = (gender: string): string => {
  if (!gender) return "Gender is required.";
  return "";
};

export const validateEmailSignup = (email: string): string => {
  const INVALID_EMAIL = "Please enter a valid email address.";

  const trimmedEmail = (email || "").trim();
  if (!trimmedEmail) {
    return "Email field cannot be left blank. Please enter your email.";
  }

  const atIndex = trimmedEmail.indexOf("@");
  if (atIndex === -1 || trimmedEmail.lastIndexOf("@") !== atIndex) {
    return INVALID_EMAIL;
  }

  const localPart = trimmedEmail.slice(0, atIndex);
  const domain = trimmedEmail.slice(atIndex + 1);
  if (!localPart || !domain) return INVALID_EMAIL;

  // username length
  if (localPart.length < 6 || localPart.length > 30) {
    return "The username must be between 6 and 30 characters long.";
  }

  // disposable domain check
  const disallowedDomains = new Set([
    "yopmail.com",
    "mailinator.com",
    "guerrillamail.com",
    "10minutemail.com",
    "aol.com",
    "example.com",
    "a.com",
    "test.com",
  ]);
  if (disallowedDomains.has(domain.toLowerCase())) {
    return "The email domain you have entered is not allowed. Please use a valid email provider.";
  }

  // numeric-only usernames
  if (localPart.length >= 8 && /^\d+$/.test(localPart)) {
    return "Sorry, usernames of 8 or more characters must include at least one alphabetical character";
  }

  // heuristics
  if (domain.length === 5 || localPart.toLowerCase() === "user") {
    return "Suspicious email addresses are not allowed.";
  }

  // regex check for local part
  const localSafe = /^[A-Za-z0-9](?:[A-Za-z0-9._-]{4,28}[A-Za-z0-9])?$/;
  if (!localSafe.test(localPart)) return INVALID_EMAIL;

  // validate domain structure
  if (!isValidDomain(domain)) return INVALID_EMAIL;

  return "";
};

const isValidDomain = (domain: string): boolean => {
  const labels = domain.split(".");
  if (labels.length < 2) return false;

  const labelRegex = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;
  const tldRegex = /^[A-Za-z]{2,}$/;

  return labels.every((lbl, i) =>
    i === labels.length - 1 ? tldRegex.test(lbl) : labelRegex.test(lbl)
  );
};


export const validatePasswordSignup = (password: string): string => {
  const isLengthValid = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!password) {
    return "Password is required.";
  } else if (!isLengthValid) {
    return "Password must be at least 8 characters long.";
  } else if (!hasUpperCase) {
    return "Password must include at least one uppercase letter.";
  } else if (!hasLowerCase) {
    return "Password must include at least one lowercase letter.";
  } else if (!hasDigit) {
    return "Password must include at least one digit.";
  } else if (!hasSpecialChar) {
    return "Password must include at least one special character.";
  }

  return "";
};

export const validateMedicalCredentials = (credentials: string): string => {
  if (!credentials) return "Credentials are required.";
  return "";
};

export const validateSpecialization = (specialization: string): string => {
  const trimmed = specialization.trim();
  if (!trimmed) {
    return "This field is required.";
  } else if (trimmed.length > 100) {
    return "This field cannot exceed 100 characters.";
  }

  return "";
};

export const validateAgreements = (
  agreeTerms: boolean,
  agreeLicense: boolean,
  interacted: AgreementInteraction
): { agreeTerms: string; agreeLicense: string } => {
  const errors = { agreeTerms: "", agreeLicense: "" };

  if (!interacted.agreeTerms || !interacted.agreeLicense) {
    return errors;
  }

  if (!agreeTerms && !agreeLicense) {
    errors.agreeTerms =
      "Please agree to both the checkboxes to complete the registration.";
    errors.agreeLicense =
      "Please agree to both the checkboxes to complete the registration.";
  } else if (agreeTerms && !agreeLicense) {
    errors.agreeLicense = "Please agree to the License Agreement to continue.";
  } else if (!agreeTerms && agreeLicense) {
    errors.agreeTerms =
      "Please agree to the Terms & Conditions and Privacy Policy to continue.";
  }

  return errors;
};

export const validateCountry = (country: string): string => {
  return !country ? "Country is a required field." : "";
};

export const validateLicenseNumber = (
  licenseNumber: string,
  touched: boolean,
  pattern: RegExp
): string => {
  if (!touched) return "";

  if (!licenseNumber) {
    return "License number is required.";
  } else if (!pattern.test(licenseNumber)) {
    return "Invalid License Number for selected country.";
  }

  return "";
};

const calculateAge = (dob: string): number => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};
export const validateDob = (dob: string): DobErrors => {
  const today = new Date();
  const selectedDate = new Date(dob);
  const errors: DobErrors = {
    invalidDateFormat: false,
    invalidAge: false,
    futureDate: false,
    blankDob: false,
  };

  if (dob.trim() === "") {
    errors.blankDob = true;
    return errors;
  }

  if (isNaN(selectedDate.getTime())) {
    errors.invalidDateFormat = true;
    return errors;
  }

  if (selectedDate > today) {
    errors.futureDate = true;
    return errors;
  }

  const age = calculateAge(dob);
  if (age < 18) {
    errors.invalidAge = true;
  }

  return errors;
};


export function validateChangePassword(password: string, currentPassword: string): string {
  const pwd = password;
  if (!pwd) {
    return 'Password is required.';
  } else if (pwd.length < 8) {
    return 'Password must be at least 8 characters long.';
  } else if (!/[A-Z]/.test(pwd)) {
    return 'Password must include at least one uppercase letter.';
  } else if (!/[a-z]/.test(pwd)) {
    return 'Password must include at least one lowercase letter.';
  } else if (!/\d/.test(pwd)) {
    return 'Password must include at least one digit.';
  } else if (!/[!@#$%^&*(),.?":{}|<>_+\-=\\`~[\]'/;]/.test(pwd)) {
    return 'Password must include at least one special character.';
  } else if (pwd === currentPassword) {
    return 'New password must be different from the current one.';
  }
  return '';
}

export const validateClinicEmail = (email: string): string => {
  const INVALID_MSG = "Please enter a valid email address.";

  const disposableEmailProviders = [
    "yopmail.com",
    "mailinator.com",
    "guerrillamail.com",
    "10minutemail.com",
    "aol.com",
    "example.com",
    "a.com",
    "test.com",
  ];

  const trimmedEmail = email.trim();
  if (!trimmedEmail) return "";

  const parts = trimmedEmail.split("@");
  if (parts.length !== 2) return INVALID_MSG;

  const [local, domain] = parts;
  if (
    trimmedEmail.length > 254 ||
    !isValidLocal(local) ||
    !isValidDomain(domain)
  ) {
    return INVALID_MSG;
  }

  if (disposableEmailProviders.includes(domain.toLowerCase())) {
    return "The email domain you have entered is not allowed. Please use a valid email provider.";
  }

  return "";
};

// ---------------- Helpers ----------------
const isValidLocal = (local: string): boolean => {
  if (!local || local.length > 64) return false;
  const localRegex = /^[A-Za-z0-9](?:[A-Za-z0-9._-]{0,62}[A-Za-z0-9])?$/;
  return localRegex.test(local);
};

export const validateFields = (
  field: string,
  value: string,
  additionalData?: { countryCode?: string }
): string => {
  const trimmed = value.trim();

  switch (field) {
    case "hospitalName":
      if (!trimmed) return "Hospital/Clinic Name is required.";
      if (trimmed.length < 3) return "Hospital/Clinic Name must be at least 3 characters long.";
      if (trimmed.length > 200) return "Hospital/Clinic Name must not exceed 200 characters.";
      if (!/^[A-Za-z\s'-.&]+$/.test(trimmed)) return "Please Enter Valid Hospital/Clinic Name.";
      return "";

    case "phoneNumber":
      if (!trimmed) return "Phone Number is required.";
      if (!/^[+\d]+$/.test(trimmed)) return "Phone Number contains invalid characters.";
      if (trimmed.length < 5) return "Phone number is too short.";

      try {
        const phoneUtil = PhoneNumberUtil.getInstance();
        const parsedNumber = phoneUtil.parse(
          (additionalData?.countryCode || "+1") + trimmed
        );
        if (!phoneUtil.isValidNumber(parsedNumber)) {
          return "Please enter a valid phone number for the selected country.";
        }
      } catch {
        return "Please enter a valid phone number.";
      }
      return "";

    case "address":
      if (!trimmed) return "Address is required.";
      if (trimmed.length < 3) return "Address must be at least 3 characters long.";
      return "";

    default:
      return "";
  }
};

export const validateSpecializationInput = (input: string): string => {
  const sanitized = input.replace(/[^A-Za-z\s]/g, "");
  return sanitized;
};

export const validateFieldsDoctorInfo = (fields: {
  medCred: string | string[];
  specialization: string;
}) => {
  const errors: Record<string, string> = {};

  if (!fields.medCred || (Array.isArray(fields.medCred) && fields.medCred.length === 0)) {
    errors.medCred = "Please provide at least one medical credential.";
  }

  // Validate Specialization
  if (!fields.specialization || typeof fields.specialization !== "string" || fields.specialization.trim() === "") {
    errors.specialization = "Specialization field cannot be empty.";
    }
    return errors;
};

export function validatePhone(value: string): string {
  return /^\d{5,15}$/.test(value) ? "" : "Phone must be 5–15 digits.";
}

export function validateRequirements(value: string): string {
  if (!value.trim()) return "";
  if (value.length < 10 || value.length > 500)
    return "Must be 10–500 characters.";
  return "";
}

export function formatDateToDDMMYYYY(dateString: string): string {
  if (!dateString) return "";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return "";
  }
}

export function capitalizeGender(gender?: string): string | undefined {
  if (!gender) return undefined;
  // Handle special cases for multi-word genders
  const genderMap: Record<string, string> = {
    'male': 'Male',
    'female': 'Female',
    'transgender': 'Transgender',
    'non-binary': 'Non-binary',
    'prefer-not-to-say': 'Prefer Not to Say',
    'prefer not to say': 'Prefer Not to Say'
  };
  const lowerGender = gender.toLowerCase().trim();
  return genderMap[lowerGender] || gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
}

import { useState } from "react";
import "./CheckoutForm.css";

const PHONE_PATTERN = /^[0-9]{10}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCustomer(customer) {
  const errors = {};
  if (!customer.name.trim()) errors.name = "Full name is required.";
  if (!EMAIL_PATTERN.test(customer.email)) errors.email = "Enter a valid email address.";
  if (!PHONE_PATTERN.test(customer.phone)) errors.phone = "Enter a valid 10-digit phone number.";
  return errors;
}

export default function CheckoutForm({ customer, onChange, errors }) {
  const [touched, setTouched] = useState({});

  function handleChange(field, value) {
    onChange({ ...customer, [field]: value });
  }

  function handleBlur(field) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  const showError = (field) => touched[field] && errors[field];

  return (
    <div className="checkout-form glass">
      <h3>Customer Information</h3>

      <div className="checkout-form-grid">
        <div className="field">
          <label htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            type="text"
            value={customer.name}
            onChange={(e) => handleChange("name", e.target.value)}
            onBlur={() => handleBlur("name")}
            className={showError("name") ? "has-error" : ""}
            placeholder="Rahul Sharma"
            autoComplete="name"
          />
          {showError("name") && <span className="field-error">{errors.name}</span>}
        </div>

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={customer.email}
            onChange={(e) => handleChange("email", e.target.value)}
            onBlur={() => handleBlur("email")}
            className={showError("email") ? "has-error" : ""}
            placeholder="rahul@example.com"
            autoComplete="email"
          />
          {showError("email") && <span className="field-error">{errors.email}</span>}
        </div>

        <div className="field">
          <label htmlFor="phone">Phone number</label>
          <input
            id="phone"
            type="tel"
            value={customer.phone}
            onChange={(e) => handleChange("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
            onBlur={() => handleBlur("phone")}
            className={showError("phone") ? "has-error" : ""}
            placeholder="9999999999"
            autoComplete="tel"
          />
          {showError("phone") && <span className="field-error">{errors.phone}</span>}
        </div>
      </div>
    </div>
  );
}

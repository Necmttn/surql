import { describe, it, expect } from "vitest";
import { Schema } from "effect";
import {
  emailSchema,
  usernameSchema,
  passwordSchema,
  nonEmptyString,
  maxLength,
  minLength
} from "../../lib/constraints";

/**
 * Level 3: Custom Error Messages and Validation Feedback
 * 
 * This test demonstrates how to use annotations to provide rich,
 * contextual error messages and validation feedback for better UX.
 */
describe("Level 3: Validation Messages", () => {
  describe("Custom Error Messages", () => {
    it("should provide contextual error messages", () => {
      // User registration schema with detailed error messages
      const registrationSchema = Schema.Struct({
        username: Schema.String.pipe(
          Schema.nonEmptyString({ 
            message: () => "Username is required and cannot be empty" 
          }),
          Schema.minLength(3, { 
            message: (issue) => `Username must be at least 3 characters (currently ${issue.actual})` 
          }),
          Schema.maxLength(20, { 
            message: (issue) => `Username cannot exceed 20 characters (currently ${issue.actual})` 
          }),
          Schema.pattern(/^[a-zA-Z0-9_]+$/, { 
            message: () => "Username can only contain letters, numbers, and underscores" 
          })
        ).annotations({
          identifier: "Username",
          title: "Username",
          description: "Your unique account identifier",
          helpText: "Choose a username that's easy to remember",
          errorMessages: {
            required: "Please choose a username for your account",
            minLength: "Username needs to be longer to ensure uniqueness",
            maxLength: "Please choose a shorter username",
            pattern: "Special characters aren't allowed in usernames"
          }
        }),

        email: Schema.String.pipe(
          Schema.nonEmptyString({ 
            message: () => "Email address is required" 
          }),
          Schema.pattern(/^[^@]+@[^@]+\.[^@]+$/, { 
            message: () => "Please enter a valid email address (example: user@domain.com)" 
          }),
          Schema.maxLength(255, { 
            message: () => "Email address is too long" 
          })
        ).annotations({
          identifier: "Email",
          title: "Email Address",
          description: "We'll use this to contact you",
          helpText: "Enter the email address you check regularly",
          errorMessages: {
            required: "We need your email address to create your account",
            pattern: "Please double-check your email format",
            maxLength: "Please use a shorter email address"
          }
        }),

        password: Schema.String.pipe(
          Schema.nonEmptyString({ 
            message: () => "Password is required" 
          }),
          Schema.minLength(8, { 
            message: (issue) => `Password must be at least 8 characters (${issue.actual} provided)` 
          }),
          Schema.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/, { 
            message: () => "Password must include uppercase, lowercase, number, and special character" 
          })
        ).annotations({
          identifier: "Password",
          title: "Password",
          description: "Create a strong password to protect your account",
          helpText: "Use a mix of letters, numbers, and symbols",
          errorMessages: {
            required: "Please create a password to secure your account",
            minLength: "Your password needs to be longer for security",
            pattern: "Make your password stronger by including all character types"
          },
          passwordStrength: {
            weak: "This password is too weak",
            fair: "This password is okay but could be stronger", 
            good: "This is a good password",
            strong: "Excellent! This is a very strong password"
          }
        }),

        confirmPassword: Schema.String.pipe(
          Schema.nonEmptyString({ 
            message: () => "Please confirm your password" 
          })
        ).annotations({
          identifier: "ConfirmPassword",
          title: "Confirm Password",
          description: "Re-enter your password to confirm",
          helpText: "This should match exactly with your password above",
          errorMessages: {
            required: "Please re-enter your password to confirm",
            mismatch: "Passwords don't match - please check both fields"
          }
        })
      }).pipe(
        Schema.filter(
          (data) => data.password === data.confirmPassword,
          {
            message: () => "Password confirmation doesn't match - please make sure both passwords are identical"
          }
        )
      ).annotations({
        identifier: "Registration",
        title: "Account Registration",
        description: "Create your new account",
        errorMessages: {
          passwordMismatch: "Please make sure both password fields match exactly"
        }
      });

      // Test error message content for various validation failures
      
      // Test empty username
      try {
        Schema.decodeUnknownSync(registrationSchema)({
          username: "",
          email: "test@example.com",
          password: "SecurePass123!",
          confirmPassword: "SecurePass123!"
        });
        expect.fail("Should have thrown for empty username");
      } catch (error) {
        expect(error.message).toContain("Username is required and cannot be empty");
      }

      // Test short username
      try {
        Schema.decodeUnknownSync(registrationSchema)({
          username: "ab",
          email: "test@example.com", 
          password: "SecurePass123!",
          confirmPassword: "SecurePass123!"
        });
        expect.fail("Should have thrown for short username");
      } catch (error) {
        expect(error.message).toContain("must be at least 3 characters");
      }

      // Test invalid email
      try {
        Schema.decodeUnknownSync(registrationSchema)({
          username: "testuser",
          email: "invalid-email",
          password: "SecurePass123!",
          confirmPassword: "SecurePass123!"
        });
        expect.fail("Should have thrown for invalid email");
      } catch (error) {
        expect(error.message).toContain("Please enter a valid email address");
      }

      // Test weak password
      try {
        Schema.decodeUnknownSync(registrationSchema)({
          username: "testuser",
          email: "test@example.com",
          password: "weak",
          confirmPassword: "weak"
        });
        expect.fail("Should have thrown for weak password");
      } catch (error) {
        expect(error.message).toMatch(/Password must be at least 8 characters|uppercase, lowercase, number, and special character/);
      }

      // Test password mismatch
      try {
        Schema.decodeUnknownSync(registrationSchema)({
          username: "testuser",
          email: "test@example.com",
          password: "SecurePass123!",
          confirmPassword: "DifferentPass123!"
        });
        expect.fail("Should have thrown for password mismatch");
      } catch (error) {
        expect(error.message).toContain("Password confirmation doesn't match");
      }

      // Test valid registration
      const validData = {
        username: "testuser",
        email: "test@example.com",
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!"
      };
      expect(() => Schema.decodeUnknownSync(registrationSchema)(validData)).not.toThrow();
    });

    it("should provide field-specific error contexts", () => {
      // Product form with different error contexts for different fields
      const productSchema = Schema.Struct({
        name: Schema.String.pipe(
          Schema.nonEmptyString({ 
            message: () => "Product name is required for listing" 
          }),
          Schema.minLength(3, { 
            message: () => "Product name should be descriptive (at least 3 characters)" 
          }),
          Schema.maxLength(100, { 
            message: () => "Product name is too long for display (max 100 characters)" 
          })
        ).annotations({
          identifier: "ProductName",
          context: "product-listing",
          errorMessages: {
            businessRule: "Product names must be unique within your store",
            seoAdvice: "Include relevant keywords for better search visibility"
          }
        }),

        price: Schema.Number.pipe(
          Schema.positive({ 
            message: () => "Price must be greater than $0.00" 
          }),
          Schema.lessThanOrEqualTo(999999.99, { 
            message: () => "Price cannot exceed $999,999.99" 
          })
        ).annotations({
          identifier: "ProductPrice",
          context: "financial",
          errorMessages: {
            businessRule: "Prices must be competitive within your market",
            taxAdvice: "Remember to account for applicable taxes",
            currencyFormat: "Price should be in USD with up to 2 decimal places"
          }
        }),

        category: Schema.Literal("electronics", "books", "clothing", "home", "sports").pipe(
        ).annotations({
          identifier: "ProductCategory",
          context: "categorization",
          errorMessages: {
            businessRule: "Choose the most specific category for better discoverability",
            compliance: "Some categories have additional requirements or restrictions"
          }
        }),

        description: Schema.String.pipe(
          Schema.nonEmptyString({ 
            message: () => "Product description helps customers understand what you're selling" 
          }),
          Schema.minLength(20, { 
            message: () => "Description should be more detailed (at least 20 characters)" 
          }),
          Schema.maxLength(2000, { 
            message: () => "Description is too long for optimal display (max 2000 characters)" 
          })
        ).annotations({
          identifier: "ProductDescription",
          context: "marketing",
          errorMessages: {
            seoAdvice: "Include relevant keywords and features in your description",
            customerAdvice: "Highlight benefits and unique selling points",
            formatAdvice: "Use bullet points or short paragraphs for readability"
          }
        })
      }).annotations({
        identifier: "Product",
        context: "e-commerce",
        errorMessages: {
          completeness: "Please fill in all required fields to list your product",
          optimization: "Complete product information leads to better sales"
        }
      });

      // Test contextual error messages
      try {
        Schema.decodeUnknownSync(productSchema)({
          name: "",
          price: -10,
          category: "electronics" as const,
          description: "Short"
        });
        expect.fail("Should have thrown for invalid product");
      } catch (error) {
        expect(error.message).toContain("Product name is required for listing");
      }

      // Valid product should pass
      const validProduct = {
        name: "Wireless Bluetooth Headphones",
        price: 99.99,
        category: "electronics" as const,
        description: "High-quality wireless headphones with noise cancellation and 20-hour battery life. Perfect for commuting and travel."
      };
      expect(() => Schema.decodeUnknownSync(productSchema)(validProduct)).not.toThrow();
    });
  });

  describe("Progressive Error Disclosure", () => {
    it("should support layered error messages", () => {
      // Schema with progressive error disclosure
      const advancedValidationSchema = Schema.Struct({
        creditCard: Schema.String.pipe(
          Schema.nonEmptyString({ 
            message: () => "Credit card number is required" 
          }),
          Schema.pattern(/^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/, { 
            message: () => "Credit card must be 16 digits (spaces optional)" 
          })
        ).annotations({
          identifier: "CreditCard",
          errorLevels: {
            required: {
              severity: "error",
              message: "Credit card number is required to complete your purchase",
              helpText: "We accept Visa, MasterCard, and American Express"
            },
            format: {
              severity: "error", 
              message: "Please enter a valid 16-digit credit card number",
              helpText: "You can include spaces between groups of 4 digits",
              examples: ["1234 5678 9012 3456", "1234567890123456"]
            },
            luhn: {
              severity: "warning",
              message: "This card number doesn't appear to be valid",
              helpText: "Please double-check the number on your card"
            }
          },
          securityNote: "Your credit card information is encrypted and secure"
        }),

        expiryDate: Schema.String.pipe(
          Schema.nonEmptyString({ 
            message: () => "Expiry date is required" 
          }),
          Schema.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/, { 
            message: () => "Expiry date must be in MM/YY format" 
          })
        ).annotations({
          identifier: "ExpiryDate",
          errorLevels: {
            required: {
              severity: "error",
              message: "Please enter your card's expiry date",
              helpText: "Found on the front of your card"
            },
            format: {
              severity: "error",
              message: "Expiry date must be in MM/YY format",
              examples: ["12/25", "01/28"]
            },
            expired: {
              severity: "error",
              message: "This card has expired",
              helpText: "Please use a different card or contact your bank"
            }
          }
        }),

        cvv: Schema.String.pipe(
          Schema.nonEmptyString({ 
            message: () => "CVV is required" 
          }),
          Schema.pattern(/^\d{3,4}$/, { 
            message: () => "CVV must be 3 or 4 digits" 
          })
        ).annotations({
          identifier: "CVV",
          errorLevels: {
            required: {
              severity: "error",
              message: "CVV is required for security",
              helpText: "Usually 3 digits on the back of your card"
            },
            format: {
              severity: "error",
              message: "CVV must be 3 or 4 digits",
              helpText: "American Express cards have 4-digit CVV on the front"
            }
          },
          securityNote: "CVV helps verify you have the physical card"
        })
      }).annotations({
        identifier: "PaymentForm",
        errorLevels: {
          incomplete: {
            severity: "warning",
            message: "Please complete all payment fields",
            helpText: "All fields are required for secure payment processing"
          },
          validation: {
            severity: "error", 
            message: "Please correct the errors above",
            helpText: "Check that all information matches your card exactly"
          }
        },
        securityMessage: "Your payment information is protected with industry-standard encryption"
      });

      // Test different error scenarios
      
      // Missing credit card
      try {
        Schema.decodeUnknownSync(advancedValidationSchema)({
          creditCard: "",
          expiryDate: "12/25",
          cvv: "123"
        });
        expect.fail("Should have thrown for missing credit card");
      } catch (error) {
        expect(error.message).toContain("Credit card number is required");
      }

      // Invalid format
      try {
        Schema.decodeUnknownSync(advancedValidationSchema)({
          creditCard: "123",
          expiryDate: "12/25",
          cvv: "123"
        });
        expect.fail("Should have thrown for invalid format");
      } catch (error) {
        expect(error.message).toContain("16 digits");
      }

      // Valid payment info
      const validPayment = {
        creditCard: "1234 5678 9012 3456",
        expiryDate: "12/25",
        cvv: "123"
      };
      expect(() => Schema.decodeUnknownSync(advancedValidationSchema)(validPayment)).not.toThrow();
    });
  });

  describe("Localized Error Messages", () => {
    it("should support internationalized error messages", () => {
      // Schema with i18n-ready error messages
      const i18nSchema = Schema.Struct({
        email: Schema.String.pipe(
          Schema.nonEmptyString({ 
            message: () => "validation.email.required" 
          }),
          Schema.pattern(/^[^@]+@[^@]+\.[^@]+$/, { 
            message: () => "validation.email.invalid" 
          })
        ).annotations({
          identifier: "Email",
          i18nKeys: {
            label: "form.email.label",
            placeholder: "form.email.placeholder",
            helpText: "form.email.help",
            errors: {
              required: "validation.email.required",
              invalid: "validation.email.invalid"
            }
          },
          translations: {
            en: {
              label: "Email Address",
              placeholder: "Enter your email",
              helpText: "We'll use this to contact you",
              errors: {
                required: "Email address is required",
                invalid: "Please enter a valid email address"
              }
            },
            es: {
              label: "Dirección de correo electrónico",
              placeholder: "Ingresa tu correo electrónico",
              helpText: "Usaremos esto para contactarte",
              errors: {
                required: "La dirección de correo electrónico es obligatoria",
                invalid: "Por favor ingresa una dirección de correo electrónico válida"
              }
            },
            fr: {
              label: "Adresse e-mail",
              placeholder: "Entrez votre e-mail",
              helpText: "Nous utiliserons ceci pour vous contacter",
              errors: {
                required: "L'adresse e-mail est requise",
                invalid: "Veuillez entrer une adresse e-mail valide"
              }
            }
          }
        }),

        name: Schema.String.pipe(
          Schema.nonEmptyString({ 
            message: () => "validation.name.required" 
          }),
          Schema.minLength(2, { 
            message: () => "validation.name.tooShort" 
          })
        ).annotations({
          identifier: "Name",
          i18nKeys: {
            label: "form.name.label",
            errors: {
              required: "validation.name.required",
              tooShort: "validation.name.tooShort"
            }
          },
          translations: {
            en: {
              label: "Full Name",
              errors: {
                required: "Name is required",
                tooShort: "Name must be at least 2 characters"
              }
            },
            es: {
              label: "Nombre completo",
              errors: {
                required: "El nombre es obligatorio",
                tooShort: "El nombre debe tener al menos 2 caracteres"
              }
            },
            fr: {
              label: "Nom complet",
              errors: {
                required: "Le nom est requis",
                tooShort: "Le nom doit contenir au moins 2 caractères"
              }
            }
          }
        })
      }).annotations({
        identifier: "ContactForm",
        i18nKeys: {
          title: "form.contact.title",
          submit: "form.contact.submit"
        },
        translations: {
          en: {
            title: "Contact Information",
            submit: "Submit Form"
          },
          es: {
            title: "Información de contacto",
            submit: "Enviar formulario"
          },
          fr: {
            title: "Informations de contact",
            submit: "Soumettre le formulaire"
          }
        }
      });

      // Helper function to simulate translation
      const translateError = (errorMessage: string, locale: string) => {
        // In a real app, this would look up translations
        if (errorMessage === "validation.email.required") {
          switch (locale) {
            case "es": return "La dirección de correo electrónico es obligatoria";
            case "fr": return "L'adresse e-mail est requise";
            default: return "Email address is required";
          }
        }
        return errorMessage;
      };

      // Test that schema structure supports i18n
      expect(i18nSchema.ast.annotations).toBeDefined();

      // Test validation still works
      try {
        Schema.decodeUnknownSync(i18nSchema)({
          email: "",
          name: "John Doe"
        });
        expect.fail("Should have thrown for empty email");
      } catch (error) {
        const translated = translateError(error.message, "es");
        // Error message contains the i18n key which could be translated
        expect(error.message).toContain("validation.email.required");
      }

      // Valid data should pass
      const validData = {
        email: "john@example.com",
        name: "John Doe"
      };
      expect(() => Schema.decodeUnknownSync(i18nSchema)(validData)).not.toThrow();
    });
  });
});
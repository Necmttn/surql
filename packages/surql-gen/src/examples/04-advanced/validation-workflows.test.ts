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
 * Level 4: Complex Validation Workflows and Business Rules
 * 
 * This test demonstrates sophisticated validation patterns including
 * multi-step workflows, business rule engines, and async validation scenarios.
 */
describe("Level 4: Validation Workflows", () => {
  describe("Multi-Step Validation", () => {
    it("should support staged validation workflows", () => {
      // User registration with progressive validation
      const userRegistrationWorkflow = {
        // Step 1: Basic information
        step1: Schema.Struct({
          email: emailSchema,
          username: usernameSchema,
          agreeToTerms: Schema.Boolean.pipe(
            Schema.filter(agreed => agreed === true, {
              message: () => "You must agree to the terms of service"
            })
          )
        }).annotations({
          step: 1,
          title: "Basic Information",
          description: "Provide your email and username",
          nextStep: "step2"
        }),

        // Step 2: Security setup
        step2: Schema.Struct({
          password: passwordSchema,
          confirmPassword: Schema.String.pipe(nonEmptyString),
          securityQuestion: Schema.String.pipe(
            nonEmptyString,
            Schema.minLength(10),
            maxLength(200)
          ),
          securityAnswer: Schema.String.pipe(
            nonEmptyString,
            Schema.minLength(3),
            maxLength(100)
          )
        }).pipe(
          Schema.filter(
            data => data.password === data.confirmPassword,
            { message: () => "Passwords must match" }
          )
        ).annotations({
          step: 2,
          title: "Security Setup",
          description: "Create a secure password and recovery question",
          previousStep: "step1",
          nextStep: "step3"
        }),

        // Step 3: Profile information
        step3: Schema.Struct({
          firstName: Schema.String.pipe(
            nonEmptyString,
            minLength(2),
            maxLength(50)
          ),
          lastName: Schema.String.pipe(
            nonEmptyString,
            minLength(2),
            maxLength(50)
          ),
          dateOfBirth: Schema.String.pipe(
            nonEmptyString,
            Schema.pattern(/^\d{4}-\d{2}-\d{2}$/, {
              message: () => "Date must be in YYYY-MM-DD format"
            })
          ),
          phoneNumber: Schema.optional(
            Schema.String.pipe(
              nonEmptyString,
              Schema.pattern(/^\+?[\d\s\-\(\)]{10,20}$/, {
                message: () => "Invalid phone number format"
              })
            )
          )
        }).pipe(
          Schema.filter(
            data => {
              // Age validation - must be 13 or older
              const birthDate = new Date(data.dateOfBirth);
              const today = new Date();
              const age = today.getFullYear() - birthDate.getFullYear();
              const monthDiff = today.getMonth() - birthDate.getMonth();
              
              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                return age - 1 >= 13;
              }
              return age >= 13;
            },
            { message: () => "You must be at least 13 years old to register" }
          )
        ).annotations({
          step: 3,
          title: "Profile Information",
          description: "Tell us about yourself",
          previousStep: "step2",
          nextStep: "complete"
        })
      };

      // Test Step 1 validation
      const step1Data = {
        email: "user@example.com",
        username: "newuser",
        agreeToTerms: true
      };
      expect(() => Schema.decodeUnknownSync(userRegistrationWorkflow.step1)(step1Data)).not.toThrow();

      // Test Step 1 failure
      const step1Invalid = {
        email: "user@example.com",
        username: "newuser",
        agreeToTerms: false
      };
      expect(() => Schema.decodeUnknownSync(userRegistrationWorkflow.step1)(step1Invalid)).toThrow();

      // Test Step 2 validation
      const step2Data = {
        password: "SecurePass123!",
        confirmPassword: "SecurePass123!",
        securityQuestion: "What was the name of your first pet?",
        securityAnswer: "Fluffy"
      };
      expect(() => Schema.decodeUnknownSync(userRegistrationWorkflow.step2)(step2Data)).not.toThrow();

      // Test Step 3 validation
      const step3Data = {
        firstName: "John",
        lastName: "Doe",
        dateOfBirth: "1990-01-01",
        phoneNumber: "+1 555 123 4567"
      };
      expect(() => Schema.decodeUnknownSync(userRegistrationWorkflow.step3)(step3Data)).not.toThrow();

      // Test age validation failure
      const step3TooYoung = {
        firstName: "Young",
        lastName: "User",
        dateOfBirth: "2015-01-01", // Too young
        phoneNumber: "+1 555 123 4567"
      };
      expect(() => Schema.decodeUnknownSync(userRegistrationWorkflow.step3)(step3TooYoung)).toThrow();
    });

    it("should support conditional validation flows", () => {
      // E-commerce checkout with conditional validation
      const checkoutWorkflow = {
        // Customer type determines validation path
        customerType: Schema.Literal("guest", "registered", "business"),

        // Guest checkout
        guestCheckout: Schema.Struct({
          customerType: Schema.Literal("guest"),
          email: emailSchema,
          shippingAddress: Schema.Struct({
            firstName: Schema.String.pipe(nonEmptyString),
            lastName: Schema.String.pipe(nonEmptyString),
            street: Schema.String.pipe(nonEmptyString),
            city: Schema.String.pipe(nonEmptyString),
            state: Schema.String.pipe(nonEmptyString),
            zipCode: Schema.String.pipe(
              nonEmptyString,
              Schema.pattern(/^\d{5}(-\d{4})?$/)
            ),
            country: Schema.String.pipe(nonEmptyString)
          }),
          billingAddress: Schema.optional(Schema.Struct({
            firstName: Schema.String.pipe(nonEmptyString),
            lastName: Schema.String.pipe(nonEmptyString),
            street: Schema.String.pipe(nonEmptyString),
            city: Schema.String.pipe(nonEmptyString),
            state: Schema.String.pipe(nonEmptyString),
            zipCode: Schema.String.pipe(
              nonEmptyString,
              Schema.pattern(/^\d{5}(-\d{4})?$/)
            ),
            country: Schema.String.pipe(nonEmptyString)
          })),
          createAccount: Schema.Boolean
        }).annotations({
          flow: "guest",
          description: "Guest checkout with optional account creation"
        }),

        // Registered user checkout
        registeredCheckout: Schema.Struct({
          customerType: Schema.Literal("registered"),
          userId: Schema.String.pipe(nonEmptyString),
          selectedAddressId: Schema.optional(Schema.String),
          newAddress: Schema.optional(Schema.Struct({
            type: Schema.Literal("shipping", "billing"),
            firstName: Schema.String.pipe(nonEmptyString),
            lastName: Schema.String.pipe(nonEmptyString),
            street: Schema.String.pipe(nonEmptyString),
            city: Schema.String.pipe(nonEmptyString),
            state: Schema.String.pipe(nonEmptyString),
            zipCode: Schema.String.pipe(nonEmptyString),
            country: Schema.String.pipe(nonEmptyString),
            isDefault: Schema.Boolean
          }))
        }).pipe(
          Schema.filter(
            data => data.selectedAddressId !== undefined || data.newAddress !== undefined,
            { message: () => "Either select an existing address or provide a new one" }
          )
        ).annotations({
          flow: "registered",
          description: "Registered user with saved addresses"
        }),

        // Business checkout
        businessCheckout: Schema.Struct({
          customerType: Schema.Literal("business"),
          businessId: Schema.String.pipe(nonEmptyString),
          purchaseOrderNumber: Schema.optional(Schema.String),
          billingContact: Schema.Struct({
            name: Schema.String.pipe(nonEmptyString),
            email: emailSchema,
            phone: Schema.String.pipe(nonEmptyString),
            department: Schema.optional(Schema.String)
          }),
          shippingContact: Schema.optional(Schema.Struct({
            name: Schema.String.pipe(nonEmptyString),
            email: emailSchema,
            phone: Schema.String.pipe(nonEmptyString)
          })),
          taxExempt: Schema.Boolean,
          taxExemptionNumber: Schema.optional(Schema.String)
        }).pipe(
          Schema.filter(
            data => !data.taxExempt || data.taxExemptionNumber !== undefined,
            { message: () => "Tax exemption number required for tax-exempt purchases" }
          )
        ).annotations({
          flow: "business",
          description: "Business checkout with tax exemption support"
        })
      };

      // Test guest checkout
      const guestData = {
        customerType: "guest" as const,
        email: "guest@example.com",
        shippingAddress: {
          firstName: "John",
          lastName: "Doe",
          street: "123 Main St",
          city: "San Francisco",
          state: "CA",
          zipCode: "94105",
          country: "USA"
        },
        createAccount: false
      };
      expect(() => Schema.decodeUnknownSync(checkoutWorkflow.guestCheckout)(guestData)).not.toThrow();

      // Test registered user checkout
      const registeredData = {
        customerType: "registered" as const,
        userId: "user-123",
        selectedAddressId: "addr-456"
      };
      expect(() => Schema.decodeUnknownSync(checkoutWorkflow.registeredCheckout)(registeredData)).not.toThrow();

      // Test business checkout
      const businessData = {
        customerType: "business" as const,
        businessId: "biz-789",
        billingContact: {
          name: "Jane Smith",
          email: "jane@company.com",
          phone: "+1 555 987 6543",
          department: "Procurement"
        },
        taxExempt: true,
        taxExemptionNumber: "TX-123456789"
      };
      expect(() => Schema.decodeUnknownSync(checkoutWorkflow.businessCheckout)(businessData)).not.toThrow();

      // Test business validation failure (tax exempt without number)
      const businessInvalid = {
        customerType: "business" as const,
        businessId: "biz-789",
        billingContact: {
          name: "Jane Smith",
          email: "jane@company.com",
          phone: "+1 555 987 6543"
        },
        taxExempt: true
        // Missing taxExemptionNumber
      };
      expect(() => Schema.decodeUnknownSync(checkoutWorkflow.businessCheckout)(businessInvalid)).toThrow();
    });
  });

  describe("Business Rule Validation", () => {
    it("should implement complex business rules", () => {
      // Loan application with business rules
      const loanApplicationSchema = Schema.Struct({
        applicantInfo: Schema.Struct({
          firstName: Schema.String.pipe(nonEmptyString),
          lastName: Schema.String.pipe(nonEmptyString),
          dateOfBirth: Schema.String,
          ssn: Schema.String.pipe(
            nonEmptyString,
            Schema.pattern(/^\d{3}-\d{2}-\d{4}$/)
          ),
          creditScore: Schema.Number.pipe(
            Schema.int(),
            Schema.between(300, 850)
          )
        }),
        employmentInfo: Schema.Struct({
          employmentStatus: Schema.Literal("employed", "self_employed", "unemployed", "retired"),
          currentEmployer: Schema.optional(Schema.String),
          annualIncome: Schema.Number.pipe(Schema.positive()),
          employmentDuration: Schema.Number.pipe(Schema.int(), Schema.positive()), // months
          previousEmployer: Schema.optional(Schema.String),
          previousIncome: Schema.optional(Schema.Number)
        }),
        loanDetails: Schema.Struct({
          amount: Schema.Number.pipe(
            Schema.positive(),
            Schema.lessThanOrEqualTo(1000000)
          ),
          purpose: Schema.Literal("home", "auto", "personal", "business", "education"),
          term: Schema.Number.pipe(
            Schema.int(),
            Schema.between(12, 360) // 1-30 years in months
          ),
          collateral: Schema.optional(Schema.Struct({
            type: Schema.String,
            value: Schema.Number,
            description: Schema.String
          }))
        }),
        financialInfo: Schema.Struct({
          monthlyDebtPayments: Schema.Number.pipe(Schema.nonNegative()),
          monthlyHousingPayment: Schema.Number.pipe(Schema.nonNegative()),
          assets: Schema.Number.pipe(Schema.nonNegative()),
          bankruptcies: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
          latePayments: Schema.Number.pipe(Schema.int(), Schema.nonNegative())
        })
      }).pipe(
        // Business Rule 1: Debt-to-Income Ratio
        Schema.filter(
          application => {
            const monthlyIncome = application.employmentInfo.annualIncome / 12;
            const totalDebt = application.financialInfo.monthlyDebtPayments + 
                             application.financialInfo.monthlyHousingPayment;
            const debtToIncomeRatio = totalDebt / monthlyIncome;
            
            return debtToIncomeRatio <= 0.43; // Max 43% DTI
          },
          { message: () => "Debt-to-income ratio cannot exceed 43%" }
        ),
        
        // Business Rule 2: Credit Score Requirements
        Schema.filter(
          application => {
            const { creditScore } = application.applicantInfo;
            const { amount } = application.loanDetails;
            
            // Higher loan amounts require better credit
            if (amount > 500000) return creditScore >= 720;
            if (amount > 100000) return creditScore >= 680;
            return creditScore >= 620;
          },
          { message: () => "Credit score does not meet minimum requirements for loan amount" }
        ),
        
        // Business Rule 3: Employment Stability
        Schema.filter(
          application => {
            const { employmentStatus, employmentDuration } = application.employmentInfo;
            
            if (employmentStatus === "unemployed") return false;
            if (employmentStatus === "employed" && employmentDuration < 24) return false;
            if (employmentStatus === "self_employed" && employmentDuration < 36) return false;
            
            return true;
          },
          { message: () => "Employment history does not meet minimum requirements" }
        ),
        
        // Business Rule 4: Collateral Requirements
        Schema.filter(
          application => {
            const { amount, purpose, collateral } = application.loanDetails;
            
            // Large personal loans require collateral
            if (purpose === "personal" && amount > 50000) {
              return collateral !== undefined && collateral.value >= amount * 0.8;
            }
            
            // Business loans over 250k require collateral
            if (purpose === "business" && amount > 250000) {
              return collateral !== undefined && collateral.value >= amount * 1.2;
            }
            
            return true;
          },
          { message: () => "Loan amount requires adequate collateral" }
        )
      ).annotations({
        businessRules: [
          "Maximum debt-to-income ratio: 43%",
          "Credit score minimums: 620 (basic), 680 (>$100k), 720 (>$500k)",
          "Employment: 24 months employed or 36 months self-employed",
          "Collateral: Required for personal loans >$50k and business loans >$250k"
        ]
      });

      // Test approved loan application
      const approvedApplication = {
        applicantInfo: {
          firstName: "John",
          lastName: "Doe",
          dateOfBirth: "1985-01-01",
          ssn: "123-45-6789",
          creditScore: 750
        },
        employmentInfo: {
          employmentStatus: "employed" as const,
          currentEmployer: "Tech Company",
          annualIncome: 120000,
          employmentDuration: 36
        },
        loanDetails: {
          amount: 300000,
          purpose: "home" as const,
          term: 360
        },
        financialInfo: {
          monthlyDebtPayments: 1500,
          monthlyHousingPayment: 2000,
          assets: 150000,
          bankruptcies: 0,
          latePayments: 0
        }
      };
      expect(() => Schema.decodeUnknownSync(loanApplicationSchema)(approvedApplication)).not.toThrow();

      // Test rejected loan application (DTI too high)
      const rejectedDTI = {
        ...approvedApplication,
        financialInfo: {
          ...approvedApplication.financialInfo,
          monthlyDebtPayments: 6000 // This makes DTI > 43%
        }
      };
      expect(() => Schema.decodeUnknownSync(loanApplicationSchema)(rejectedDTI)).toThrow();

      // Test rejected loan application (credit score too low)
      const rejectedCredit = {
        ...approvedApplication,
        applicantInfo: {
          ...approvedApplication.applicantInfo,
          creditScore: 600 // Too low for $300k loan
        }
      };
      expect(() => Schema.decodeUnknownSync(loanApplicationSchema)(rejectedCredit)).toThrow();
    });

    it("should support time-based validation rules", () => {
      // Event booking with time-based constraints
      const eventBookingSchema = Schema.Struct({
        eventId: Schema.String.pipe(nonEmptyString),
        attendeeInfo: Schema.Struct({
          name: Schema.String.pipe(nonEmptyString),
          email: emailSchema,
          phone: Schema.String.pipe(nonEmptyString)
        }),
        bookingDetails: Schema.Struct({
          ticketType: Schema.Literal("early_bird", "regular", "last_minute", "vip"),
          quantity: Schema.Number.pipe(
            Schema.int(),
            Schema.between(1, 10)
          ),
          bookingDate: Schema.String, // ISO date
          eventDate: Schema.String, // ISO date
          cancellationRequested: Schema.Boolean,
          cancellationDate: Schema.optional(Schema.String)
        }),
        payment: Schema.Struct({
          method: Schema.Literal("credit_card", "paypal", "bank_transfer"),
          amount: Schema.Number.pipe(Schema.positive()),
          currency: Schema.String.pipe(nonEmptyString),
          refundRequested: Schema.Boolean,
          refundReason: Schema.optional(Schema.String)
        })
      }).pipe(
        // Rule 1: Booking deadline
        Schema.filter(
          booking => {
            const bookingDate = new Date(booking.bookingDetails.bookingDate);
            const eventDate = new Date(booking.bookingDetails.eventDate);
            const daysDifference = (eventDate.getTime() - bookingDate.getTime()) / (1000 * 3600 * 24);
            
            // Must book at least 1 day before event
            return daysDifference >= 1;
          },
          { message: () => "Bookings must be made at least 24 hours before the event" }
        ),
        
        // Rule 2: Ticket type availability based on timing
        Schema.filter(
          booking => {
            const bookingDate = new Date(booking.bookingDetails.bookingDate);
            const eventDate = new Date(booking.bookingDetails.eventDate);
            const daysDifference = (eventDate.getTime() - bookingDate.getTime()) / (1000 * 3600 * 24);
            const { ticketType } = booking.bookingDetails;
            
            // Early bird: 30+ days before
            if (ticketType === "early_bird" && daysDifference < 30) return false;
            
            // Last minute: 7 days or less before
            if (ticketType === "last_minute" && daysDifference > 7) return false;
            
            return true;
          },
          { message: () => "Ticket type not available for this booking timeframe" }
        ),
        
        // Rule 3: Cancellation policy
        Schema.filter(
          booking => {
            if (!booking.bookingDetails.cancellationRequested) return true;
            if (!booking.bookingDetails.cancellationDate) return false;
            
            const cancellationDate = new Date(booking.bookingDetails.cancellationDate);
            const eventDate = new Date(booking.bookingDetails.eventDate);
            const daysDifference = (eventDate.getTime() - cancellationDate.getTime()) / (1000 * 3600 * 24);
            
            // VIP tickets: can cancel up to 24 hours before
            if (booking.bookingDetails.ticketType === "vip") return daysDifference >= 1;
            
            // Other tickets: must cancel 7 days before
            return daysDifference >= 7;
          },
          { message: () => "Cancellation not allowed within the cancellation policy timeframe" }
        ),
        
        // Rule 4: Refund eligibility
        Schema.filter(
          booking => {
            if (!booking.payment.refundRequested) return true;
            
            // Refunds only for cancelled bookings
            if (!booking.bookingDetails.cancellationRequested) return false;
            
            // Must have a reason for refund
            return booking.payment.refundReason !== undefined;
          },
          { message: () => "Refund requires valid cancellation and reason" }
        )
      ).annotations({
        timingRules: [
          "Bookings must be made at least 24 hours before event",
          "Early bird tickets: 30+ days before event",
          "Last minute tickets: 7 days or less before event",
          "Cancellation: 7 days before (VIP: 24 hours)",
          "Refunds require cancellation and reason"
        ]
      });

      // Test valid early bird booking
      const earlyBirdBooking = {
        eventId: "event-123",
        attendeeInfo: {
          name: "John Doe",
          email: "john@example.com",
          phone: "+1 555 123 4567"
        },
        bookingDetails: {
          ticketType: "early_bird" as const,
          quantity: 2,
          bookingDate: "2024-01-01T10:00:00Z",
          eventDate: "2024-03-15T19:00:00Z", // 73 days later
          cancellationRequested: false
        },
        payment: {
          method: "credit_card" as const,
          amount: 150.00,
          currency: "USD",
          refundRequested: false
        }
      };
      expect(() => Schema.decodeUnknownSync(eventBookingSchema)(earlyBirdBooking)).not.toThrow();

      // Test invalid early bird booking (too close to event)
      const invalidEarlyBird = {
        ...earlyBirdBooking,
        bookingDetails: {
          ...earlyBirdBooking.bookingDetails,
          bookingDate: "2024-03-01T10:00:00Z", // Only 14 days before
          eventDate: "2024-03-15T19:00:00Z"
        }
      };
      expect(() => Schema.decodeUnknownSync(eventBookingSchema)(invalidEarlyBird)).toThrow();

      // Test valid cancellation
      const validCancellation = {
        ...earlyBirdBooking,
        bookingDetails: {
          ...earlyBirdBooking.bookingDetails,
          cancellationRequested: true,
          cancellationDate: "2024-03-01T10:00:00Z" // 14 days before (valid for non-VIP)
        },
        payment: {
          ...earlyBirdBooking.payment,
          refundRequested: true,
          refundReason: "Schedule conflict"
        }
      };
      expect(() => Schema.decodeUnknownSync(eventBookingSchema)(validCancellation)).not.toThrow();
    });
  });

  describe("Async Validation Patterns", () => {
    it("should support async validation schemas", () => {
      // Simulated async validators
      const asyncValidators = {
        checkEmailUnique: async (email: string): Promise<boolean> => {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 10));
          return !["admin@example.com", "taken@example.com"].includes(email);
        },
        
        checkUsernameAvailable: async (username: string): Promise<boolean> => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return !["admin", "root", "administrator"].includes(username.toLowerCase());
        },
        
        validateCreditCard: async (cardNumber: string): Promise<boolean> => {
          await new Promise(resolve => setTimeout(resolve, 15));
          // Simple Luhn algorithm check
          const digits = cardNumber.replace(/\D/g, '');
          if (digits.length !== 16) return false;
          
          let sum = 0;
          let isEven = false;
          
          for (let i = digits.length - 1; i >= 0; i--) {
            let digit = parseInt(digits[i]);
            
            if (isEven) {
              digit *= 2;
              if (digit > 9) digit -= 9;
            }
            
            sum += digit;
            isEven = !isEven;
          }
          
          return sum % 10 === 0;
        }
      };

      // Registration schema with async validation markers
      const asyncRegistrationSchema = Schema.Struct({
        email: emailSchema.annotations({
          asyncValidation: "checkEmailUnique",
          asyncMessage: "This email address is already registered"
        }),
        username: usernameSchema.annotations({
          asyncValidation: "checkUsernameAvailable", 
          asyncMessage: "This username is not available"
        }),
        password: passwordSchema,
        paymentMethod: Schema.optional(
          Schema.Struct({
            cardNumber: Schema.String.pipe(
              nonEmptyString,
              Schema.pattern(/^\d{4}\s?\d{4}\s?\d{4}\s?\d{4}$/)
            ).annotations({
              asyncValidation: "validateCreditCard",
              asyncMessage: "Invalid credit card number"
            }),
            expiryDate: Schema.String.pipe(
              nonEmptyString,
              Schema.pattern(/^(0[1-9]|1[0-2])\/\d{2}$/)
            ),
            cvv: Schema.String.pipe(
              nonEmptyString,
              Schema.pattern(/^\d{3,4}$/)
            )
          })
        )
      }).annotations({
        requiresAsyncValidation: true,
        asyncValidators: ["checkEmailUnique", "checkUsernameAvailable", "validateCreditCard"]
      });

      // Simulate async validation workflow
      const validateAsync = async (data: any, schema: any) => {
        // First run synchronous validation
        try {
          Schema.decodeUnknownSync(schema)(data);
        } catch (error) {
          throw new Error(`Sync validation failed: ${error.message}`);
        }

        // Then run async validations
        const asyncValidations = [];

        if (data.email && schema.ast.annotations?.asyncValidators?.includes("checkEmailUnique")) {
          asyncValidations.push(
            asyncValidators.checkEmailUnique(data.email).then(isUnique => {
              if (!isUnique) throw new Error("This email address is already registered");
            })
          );
        }

        if (data.username && schema.ast.annotations?.asyncValidators?.includes("checkUsernameAvailable")) {
          asyncValidations.push(
            asyncValidators.checkUsernameAvailable(data.username).then(isAvailable => {
              if (!isAvailable) throw new Error("This username is not available");
            })
          );
        }

        if (data.paymentMethod?.cardNumber && schema.ast.annotations?.asyncValidators?.includes("validateCreditCard")) {
          asyncValidations.push(
            asyncValidators.validateCreditCard(data.paymentMethod.cardNumber).then(isValid => {
              if (!isValid) throw new Error("Invalid credit card number");
            })
          );
        }

        await Promise.all(asyncValidations);
        return true;
      };

      // Test async validation
      const testAsyncValidation = async () => {
        // Valid data
        const validData = {
          email: "newuser@example.com",
          username: "newuser123",
          password: "SecurePass123!",
          paymentMethod: {
            cardNumber: "4532015112830366", // Valid test card
            expiryDate: "12/25",
            cvv: "123"
          }
        };
        
        await expect(validateAsync(validData, asyncRegistrationSchema)).resolves.toBe(true);

        // Invalid email (taken)
        const takenEmailData = {
          ...validData,
          email: "admin@example.com"
        };
        
        await expect(validateAsync(takenEmailData, asyncRegistrationSchema))
          .rejects.toThrow("This email address is already registered");

        // Invalid username (reserved)
        const reservedUsernameData = {
          ...validData,
          username: "admin"
        };
        
        await expect(validateAsync(reservedUsernameData, asyncRegistrationSchema))
          .rejects.toThrow("This username is not available");

        // Invalid credit card
        const invalidCardData = {
          ...validData,
          paymentMethod: {
            ...validData.paymentMethod,
            cardNumber: "1234567890123456" // Invalid
          }
        };
        
        await expect(validateAsync(invalidCardData, asyncRegistrationSchema))
          .rejects.toThrow("Invalid credit card number");
      };

      // Run async test
      return testAsyncValidation();
    });
  });

  describe("Rule Engine Integration", () => {
    it("should support rule engine patterns", () => {
      // Rule engine for dynamic validation
      interface ValidationRule {
        id: string;
        condition: (data: any) => boolean;
        message: string;
        severity: "error" | "warning" | "info";
        field?: string;
      }

      const createRuleEngine = (rules: ValidationRule[]) => {
        return {
          validate: (data: any) => {
            const results = {
              valid: true,
              errors: [] as string[],
              warnings: [] as string[],
              info: [] as string[]
            };

            for (const rule of rules) {
              try {
                const passed = rule.condition(data);
                if (!passed) {
                  if (rule.severity === "error") {
                    results.valid = false;
                    results.errors.push(rule.message);
                  } else if (rule.severity === "warning") {
                    results.warnings.push(rule.message);
                  } else {
                    results.info.push(rule.message);
                  }
                }
              } catch (error) {
                results.valid = false;
                results.errors.push(`Rule ${rule.id} failed: ${error.message}`);
              }
            }

            return results;
          }
        };
      };

      // Business rules for insurance application
      const insuranceRules: ValidationRule[] = [
        {
          id: "age_requirement",
          condition: (data) => {
            const birthDate = new Date(data.applicant.dateOfBirth);
            const age = new Date().getFullYear() - birthDate.getFullYear();
            return age >= 18 && age <= 80;
          },
          message: "Applicant must be between 18 and 80 years old",
          severity: "error",
          field: "applicant.dateOfBirth"
        },
        {
          id: "coverage_amount_limit",
          condition: (data) => {
            const annualIncome = data.applicant.annualIncome;
            const coverageAmount = data.policy.coverageAmount;
            return coverageAmount <= annualIncome * 20;
          },
          message: "Coverage amount cannot exceed 20 times annual income",
          severity: "error",
          field: "policy.coverageAmount"
        },
        {
          id: "smoking_premium_warning",
          condition: (data) => data.health.smoker !== true,
          message: "Smoking status may affect premium rates",
          severity: "warning",
          field: "health.smoker"
        },
        {
          id: "high_risk_occupation",
          condition: (data) => {
            const riskOccupations = ["pilot", "miner", "stuntman", "professional_athlete"];
            return !riskOccupations.includes(data.applicant.occupation?.toLowerCase());
          },
          message: "High-risk occupation detected - additional review required",
          severity: "warning",
          field: "applicant.occupation"
        },
        {
          id: "medical_exam_recommendation",
          condition: (data) => {
            const age = new Date().getFullYear() - new Date(data.applicant.dateOfBirth).getFullYear();
            const coverage = data.policy.coverageAmount;
            return !(age > 50 && coverage > 500000);
          },
          message: "Medical examination recommended for high coverage amounts over age 50",
          severity: "info",
          field: "policy.coverageAmount"
        }
      ];

      const insuranceRuleEngine = createRuleEngine(insuranceRules);

      // Insurance application schema
      const insuranceApplicationSchema = Schema.Struct({
        applicant: Schema.Struct({
          firstName: Schema.String.pipe(nonEmptyString),
          lastName: Schema.String.pipe(nonEmptyString),
          dateOfBirth: Schema.String,
          ssn: Schema.String.pipe(nonEmptyString),
          occupation: Schema.String.pipe(nonEmptyString),
          annualIncome: Schema.Number.pipe(Schema.positive())
        }),
        policy: Schema.Struct({
          type: Schema.Literal("term", "whole", "universal"),
          coverageAmount: Schema.Number.pipe(Schema.positive()),
          term: Schema.optional(Schema.Number),
          beneficiaries: Schema.Array(Schema.Struct({
            name: Schema.String.pipe(nonEmptyString),
            relationship: Schema.String.pipe(nonEmptyString),
            percentage: Schema.Number.pipe(Schema.between(0, 100))
          }))
        }),
        health: Schema.Struct({
          smoker: Schema.Boolean,
          medicalConditions: Schema.Array(Schema.String),
          medications: Schema.Array(Schema.String),
          familyHistory: Schema.optional(Schema.Array(Schema.String))
        })
      }).annotations({
        ruleEngine: "insurance_rules",
        requiresBusinessRuleValidation: true
      });

      // Test valid application
      const validApplication = {
        applicant: {
          firstName: "John",
          lastName: "Doe",
          dateOfBirth: "1985-01-01",
          ssn: "123-45-6789",
          occupation: "Software Engineer",
          annualIncome: 100000
        },
        policy: {
          type: "term" as const,
          coverageAmount: 500000,
          term: 20,
          beneficiaries: [
            {
              name: "Jane Doe",
              relationship: "Spouse",
              percentage: 100
            }
          ]
        },
        health: {
          smoker: false,
          medicalConditions: [],
          medications: []
        }
      };

      // Test schema validation
      expect(() => Schema.decodeUnknownSync(insuranceApplicationSchema)(validApplication)).not.toThrow();

      // Test rule engine validation
      const ruleResults = insuranceRuleEngine.validate(validApplication);
      expect(ruleResults.valid).toBe(true);
      expect(ruleResults.errors).toHaveLength(0);

      // Test application with rule violations
      const invalidApplication = {
        ...validApplication,
        applicant: {
          ...validApplication.applicant,
          dateOfBirth: "2010-01-01", // Too young
          annualIncome: 50000
        },
        policy: {
          ...validApplication.policy,
          coverageAmount: 2000000 // Exceeds 20x income
        },
        health: {
          ...validApplication.health,
          smoker: true
        }
      };

      const invalidResults = insuranceRuleEngine.validate(invalidApplication);
      expect(invalidResults.valid).toBe(false);
      expect(invalidResults.errors.length).toBeGreaterThan(0);
      expect(invalidResults.warnings.length).toBeGreaterThan(0);
      expect(invalidResults.errors).toEqual(
        expect.arrayContaining([
          "Applicant must be between 18 and 80 years old",
          "Coverage amount cannot exceed 20 times annual income"
        ])
      );
      expect(invalidResults.warnings).toEqual(
        expect.arrayContaining([
          "Smoking status may affect premium rates"
        ])
      );
    });
  });
});
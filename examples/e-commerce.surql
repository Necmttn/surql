REMOVE DATABASE IF EXISTS ecommerce;
DEFINE DATABASE ecommerce;

-- Set up namespaces for multi-tenant architecture
DEFINE NAMESPACE production;
DEFINE NAMESPACE development;

-- Use the development namespace for now
USE NAMESPACE development;
USE DATABASE ecommerce;

-- Enable automatic GraphQL schema generation
DEFINE CONFIG GRAPHQL AUTO;

-- Define tables with SCHEMAFULL constraint for strict schema validation
DEFINE TABLE user SCHEMAFULL;
DEFINE TABLE product SCHEMAFULL;
DEFINE TABLE category SCHEMAFULL;
DEFINE TABLE order SCHEMAFULL;
DEFINE TABLE order_item SCHEMAFULL;
DEFINE TABLE address SCHEMAFULL;
DEFINE TABLE review SCHEMAFULL;
DEFINE TABLE cart SCHEMAFULL;
DEFINE TABLE cart_item SCHEMAFULL;
DEFINE TABLE payment SCHEMAFULL;
DEFINE TABLE wishlist SCHEMAFULL;

-- Define an embedding function for product search
DEFINE FUNCTION fn::text_to_embedding($text: string) {
    -- This would be replaced with an actual embedding API call in production
    LET $embeddings = (RETURN http::post('http://embedding-service:8080/embed', {
        text: $text
    }).embeddings);

    RETURN $embeddings;
}
PERMISSIONS FULL;

---------------------------
-- USER TABLE
---------------------------

DEFINE FIELD id ON user TYPE string;
DEFINE FIELD email ON user TYPE string ASSERT string::is::email($value) COMMENT "User's email address used for login and notifications";
DEFINE FIELD password ON user TYPE string COMMENT "Hashed password for user authentication";
DEFINE FIELD first_name ON user TYPE string COMMENT "User's first name";
DEFINE FIELD last_name ON user TYPE string COMMENT "User's last name";
DEFINE FIELD phone ON user TYPE option<string> COMMENT "User's contact phone number";
DEFINE FIELD created_at ON user TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the user account was created";
DEFINE FIELD updated_at ON user TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the user account was last updated";
DEFINE FIELD last_login ON user TYPE option<datetime> COMMENT "Timestamp of the user's last login";
DEFINE FIELD role ON user TYPE string DEFAULT "customer" ASSERT $value INSIDE ["customer", "admin", "support"] COMMENT "User role determining permissions within the system";
DEFINE FIELD is_active ON user TYPE bool DEFAULT true COMMENT "Whether the user account is active";
DEFINE FIELD addresses ON user TYPE array<record<address>> COMMENT "Collection of user's saved addresses";
DEFINE FIELD default_address ON user TYPE option<record<address>> COMMENT "User's default address for shipping and billing";
DEFINE FIELD orders ON user TYPE array<record<order>> COMMENT "Collection of orders placed by the user";
DEFINE FIELD cart ON user TYPE option<record<cart>> COMMENT "User's current shopping cart";
DEFINE FIELD wishlist ON user TYPE option<record<wishlist>> COMMENT "User's saved wishlist of products";
DEFINE FIELD reviews ON user TYPE array<record<review>> COMMENT "Collection of product reviews submitted by the user";

DEFINE INDEX user_email_idx ON user COLUMNS email UNIQUE;

---------------------------
-- PRODUCT TABLE
---------------------------

DEFINE FIELD id ON product TYPE string;
DEFINE FIELD sku ON product TYPE string COMMENT "Stock keeping unit - unique product identifier";
DEFINE FIELD name ON product TYPE string COMMENT "Product display name";
DEFINE FIELD description ON product TYPE string COMMENT "Detailed product description";
DEFINE FIELD short_description ON product TYPE string COMMENT "Brief product description for listings";
DEFINE FIELD price ON product TYPE decimal ASSERT $value > 0 COMMENT "Current product price";
DEFINE FIELD compare_at_price ON product TYPE option<decimal> COMMENT "Original price for comparison/sale display";
DEFINE FIELD cost_price ON product TYPE option<decimal> COMMENT "Product cost for internal calculations";
DEFINE FIELD currency ON product TYPE string DEFAULT "USD" COMMENT "Currency code for the product price";
DEFINE FIELD inventory_quantity ON product TYPE number DEFAULT 0 COMMENT "Current inventory stock level";
DEFINE FIELD weight ON product TYPE option<decimal> COMMENT "Product weight in kilograms";
DEFINE FIELD dimensions ON product TYPE option<object> {
    length: decimal,
    width: decimal,
    height: decimal,
    unit: string
} COMMENT "Product physical dimensions";
DEFINE FIELD categories ON product TYPE array<record<category>> COMMENT "Categories this product belongs to";
DEFINE FIELD primary_category ON product TYPE option<record<category>> COMMENT "Main category for product classification";
DEFINE FIELD images ON product TYPE array<object> {
    url: string,
    alt: string,
    position: number
} COMMENT "Product images with position ordering";
DEFINE FIELD thumbnail ON product TYPE option<string> COMMENT "URL to the product thumbnail image";
DEFINE FIELD is_active ON product TYPE bool DEFAULT true COMMENT "Whether the product is available for purchase";
DEFINE FIELD is_featured ON product TYPE bool DEFAULT false COMMENT "Whether the product is featured in listings";
DEFINE FIELD tags ON product TYPE array<string> COMMENT "Tags for product filtering and search";
DEFINE FIELD attributes ON product TYPE object FLEXIBLE COMMENT "Dynamic product attributes like color, size, etc.";
DEFINE FIELD created_at ON product TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the product was created";
DEFINE FIELD updated_at ON product TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the product was last updated";
DEFINE FIELD reviews ON product TYPE array<record<review>> COMMENT "Product reviews from customers";
DEFINE FIELD average_rating ON product TYPE option<decimal> COMMENT "Average product rating from reviews";
DEFINE FIELD embedding ON product TYPE option<array<float>> VALUE fn::text_to_embedding(string::concat(name, " ", description)) COMMENT "Vector embedding for semantic search";

DEFINE INDEX product_sku_idx ON product COLUMNS sku UNIQUE;
DEFINE INDEX product_name_idx ON product COLUMNS name FULLTEXT;

---------------------------
-- CATEGORY TABLE
---------------------------

DEFINE FIELD id ON category TYPE string;
DEFINE FIELD name ON category TYPE string COMMENT "Category name";
DEFINE FIELD slug ON category TYPE string COMMENT "URL-friendly version of the category name";
DEFINE FIELD description ON category TYPE option<string> COMMENT "Category description";
DEFINE FIELD parent ON category TYPE option<record<category>> COMMENT "Parent category for hierarchical categorization";
DEFINE FIELD image ON category TYPE option<string> COMMENT "URL to the category image";
DEFINE FIELD is_active ON category TYPE bool DEFAULT true COMMENT "Whether the category is visible to customers";
DEFINE FIELD position ON category TYPE number DEFAULT 0 COMMENT "Display position ordering";
DEFINE FIELD products ON category TYPE array<record<product>> COMMENT "Products belonging to this category";
DEFINE FIELD created_at ON category TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the category was created";
DEFINE FIELD updated_at ON category TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the category was last updated";

DEFINE INDEX category_slug_idx ON category COLUMNS slug UNIQUE;

---------------------------
-- ORDER TABLE
---------------------------

DEFINE FIELD id ON order TYPE string;
DEFINE FIELD order_number ON order TYPE string COMMENT "Human-readable order number";
DEFINE FIELD user ON order TYPE record<user> COMMENT "User who placed the order";
DEFINE FIELD status ON order TYPE string DEFAULT "pending" ASSERT $value INSIDE ["pending", "processing", "shipped", "delivered", "cancelled", "refunded"] COMMENT "Current order status";
DEFINE FIELD items ON order TYPE array<record<order_item>> COMMENT "Line items in the order";
DEFINE FIELD subtotal ON order TYPE decimal COMMENT "Order subtotal before taxes and shipping";
DEFINE FIELD shipping_amount ON order TYPE decimal DEFAULT 0 COMMENT "Shipping cost amount";
DEFINE FIELD tax_amount ON order TYPE decimal DEFAULT 0 COMMENT "Tax amount";
DEFINE FIELD discount_amount ON order TYPE decimal DEFAULT 0 COMMENT "Discount amount applied";
DEFINE FIELD total ON order TYPE decimal COMMENT "Final order total amount";
DEFINE FIELD currency ON order TYPE string DEFAULT "USD" COMMENT "Currency code for the order";
DEFINE FIELD shipping_address ON order TYPE record<address> COMMENT "Shipping address for the order";
DEFINE FIELD billing_address ON order TYPE option<record<address>> COMMENT "Billing address for the order";
DEFINE FIELD payment ON order TYPE option<record<payment>> COMMENT "Payment information for the order";
DEFINE FIELD notes ON order TYPE option<string> COMMENT "Order notes from customer or admin";
DEFINE FIELD created_at ON order TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the order was created";
DEFINE FIELD updated_at ON order TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the order was last updated";
DEFINE FIELD completed_at ON order TYPE option<datetime> COMMENT "Timestamp when the order was completed";
DEFINE FIELD cancelled_at ON order TYPE option<datetime> COMMENT "Timestamp when the order was cancelled";
DEFINE FIELD refunded_at ON order TYPE option<datetime> COMMENT "Timestamp when the order was refunded";
DEFINE FIELD tracking_number ON order TYPE option<string> COMMENT "Shipping tracking number";
DEFINE FIELD tracking_url ON order TYPE option<string> COMMENT "URL to track shipping status";

DEFINE INDEX order_number_idx ON order COLUMNS order_number UNIQUE;

---------------------------
-- ORDER ITEM TABLE
---------------------------

DEFINE FIELD id ON order_item TYPE string;
DEFINE FIELD order ON order_item TYPE record<order> COMMENT "Parent order";
DEFINE FIELD product ON order_item TYPE record<product> COMMENT "Product in this order item";
DEFINE FIELD quantity ON order_item TYPE number ASSERT $value > 0 COMMENT "Quantity of the product ordered";
DEFINE FIELD price ON order_item TYPE decimal COMMENT "Price per unit at time of order";
DEFINE FIELD subtotal ON order_item TYPE decimal COMMENT "Line item subtotal (price × quantity)";
DEFINE FIELD options ON order_item TYPE option<object> FLEXIBLE COMMENT "Selected product options like color, size";
DEFINE FIELD gift_message ON order_item TYPE option<string> COMMENT "Optional gift message for this item";
DEFINE FIELD is_gift ON order_item TYPE bool DEFAULT false COMMENT "Whether this item is a gift";

---------------------------
-- ADDRESS TABLE
---------------------------

DEFINE FIELD id ON address TYPE string;
DEFINE FIELD user ON address TYPE option<record<user>> COMMENT "User this address belongs to";
DEFINE FIELD first_name ON address TYPE string COMMENT "First name for the address";
DEFINE FIELD last_name ON address TYPE string COMMENT "Last name for the address";
DEFINE FIELD company ON address TYPE option<string> COMMENT "Optional company name";
DEFINE FIELD line1 ON address TYPE string COMMENT "Address line 1 (street address)";
DEFINE FIELD line2 ON address TYPE option<string> COMMENT "Address line 2 (apartment, suite, etc.)";
DEFINE FIELD city ON address TYPE string COMMENT "City name";
DEFINE FIELD state ON address TYPE string COMMENT "State/province/region";
DEFINE FIELD postal_code ON address TYPE string COMMENT "Postal/ZIP code";
DEFINE FIELD country ON address TYPE string COMMENT "Country name";
DEFINE FIELD country_code ON address TYPE string COMMENT "ISO country code";
DEFINE FIELD phone ON address TYPE option<string> COMMENT "Phone number for this address";
DEFINE FIELD is_default_shipping ON address TYPE bool DEFAULT false COMMENT "Whether this is the default shipping address";
DEFINE FIELD is_default_billing ON address TYPE bool DEFAULT false COMMENT "Whether this is the default billing address";
DEFINE FIELD created_at ON address TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the address was created";
DEFINE FIELD updated_at ON address TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the address was last updated";

---------------------------
-- REVIEW TABLE
---------------------------

DEFINE FIELD id ON review TYPE string;
DEFINE FIELD product ON review TYPE record<product> COMMENT "Product being reviewed";
DEFINE FIELD user ON review TYPE record<user> COMMENT "User who wrote the review";
DEFINE FIELD title ON review TYPE string COMMENT "Review title";
DEFINE FIELD content ON review TYPE string COMMENT "Review content";
DEFINE FIELD rating ON review TYPE number ASSERT $value >= 1 AND $value <= 5 COMMENT "Rating from 1 to 5 stars";
DEFINE FIELD is_verified_purchase ON review TYPE bool DEFAULT false COMMENT "Whether the reviewer purchased the product";
DEFINE FIELD is_approved ON review TYPE bool DEFAULT false COMMENT "Whether the review is approved for display";
DEFINE FIELD helpful_votes ON review TYPE number DEFAULT 0 COMMENT "Number of helpful votes";
DEFINE FIELD created_at ON review TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the review was created";
DEFINE FIELD updated_at ON review TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the review was last updated";

DEFINE EVENT review_created ON review WHEN $event = "CREATE" THEN {
    -- Update product average rating when a review is created
    LET $product = $this.product;
    LET $reviews = (SELECT * FROM review WHERE product = $product AND is_approved = true);
    LET $avg_rating = math::mean($reviews.*.rating);
    
    UPDATE $product SET average_rating = $avg_rating;
};

---------------------------
-- CART TABLE
---------------------------

DEFINE FIELD id ON cart TYPE string;
DEFINE FIELD user ON cart TYPE option<record<user>> COMMENT "User who owns the cart";
DEFINE FIELD session_id ON cart TYPE option<string> COMMENT "Session ID for guest carts";
DEFINE FIELD items ON cart TYPE array<record<cart_item>> COMMENT "Items in the cart";
DEFINE FIELD subtotal ON cart TYPE decimal DEFAULT 0 COMMENT "Cart subtotal before taxes and shipping";
DEFINE FIELD created_at ON cart TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the cart was created";
DEFINE FIELD updated_at ON cart TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the cart was last updated";
DEFINE FIELD expires_at ON cart TYPE option<datetime> COMMENT "Expiration timestamp for the cart";
DEFINE FIELD coupon_code ON cart TYPE option<string> COMMENT "Applied coupon code";
DEFINE FIELD discount_amount ON cart TYPE decimal DEFAULT 0 COMMENT "Discount amount from coupon";

DEFINE INDEX cart_user_idx ON cart COLUMNS user UNIQUE;
DEFINE INDEX cart_session_idx ON cart COLUMNS session_id UNIQUE;

---------------------------
-- CART ITEM TABLE
---------------------------

DEFINE FIELD id ON cart_item TYPE string;
DEFINE FIELD cart ON cart_item TYPE record<cart> COMMENT "Parent cart";
DEFINE FIELD product ON cart_item TYPE record<product> COMMENT "Product in cart";
DEFINE FIELD quantity ON cart_item TYPE number DEFAULT 1 ASSERT $value > 0 COMMENT "Quantity of the product";
DEFINE FIELD options ON cart_item TYPE option<object> FLEXIBLE COMMENT "Selected product options";
DEFINE FIELD added_at ON cart_item TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the item was added to cart";
DEFINE FIELD price ON cart_item TYPE decimal COMMENT "Current product price";
DEFINE FIELD subtotal ON cart_item TYPE decimal COMMENT "Line item subtotal (price × quantity)";

---------------------------
-- PAYMENT TABLE
---------------------------

DEFINE FIELD id ON payment TYPE string;
DEFINE FIELD order ON payment TYPE record<order> COMMENT "Associated order";
DEFINE FIELD amount ON payment TYPE decimal COMMENT "Payment amount";
DEFINE FIELD currency ON payment TYPE string DEFAULT "USD" COMMENT "Currency code";
DEFINE FIELD payment_method ON payment TYPE string COMMENT "Payment method (e.g., credit_card, paypal)";
DEFINE FIELD status ON payment TYPE string DEFAULT "pending" ASSERT $value INSIDE ["pending", "processing", "completed", "failed", "refunded"] COMMENT "Payment status";
DEFINE FIELD transaction_id ON payment TYPE option<string> COMMENT "Payment gateway transaction ID";
DEFINE FIELD gateway ON payment TYPE string COMMENT "Payment gateway provider";
DEFINE FIELD gateway_response ON payment TYPE option<object> FLEXIBLE COMMENT "Raw response from payment gateway";
DEFINE FIELD created_at ON payment TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the payment was created";
DEFINE FIELD updated_at ON payment TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the payment was last updated";
DEFINE FIELD completed_at ON payment TYPE option<datetime> COMMENT "Timestamp when the payment was completed";
DEFINE FIELD refunded_at ON payment TYPE option<datetime> COMMENT "Timestamp when the payment was refunded";

DEFINE INDEX payment_transaction_idx ON payment COLUMNS transaction_id;

---------------------------
-- WISHLIST TABLE
---------------------------

DEFINE FIELD id ON wishlist TYPE string;
DEFINE FIELD user ON wishlist TYPE record<user> COMMENT "User who owns the wishlist";
DEFINE FIELD name ON wishlist TYPE string DEFAULT "Default" COMMENT "Wishlist name";
DEFINE FIELD is_public ON wishlist TYPE bool DEFAULT false COMMENT "Whether the wishlist is publicly visible";
DEFINE FIELD products ON wishlist TYPE array<record<product>> COMMENT "Products in the wishlist";
DEFINE FIELD created_at ON wishlist TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the wishlist was created";
DEFINE FIELD updated_at ON wishlist TYPE datetime DEFAULT time::now() COMMENT "Timestamp when the wishlist was last updated";

DEFINE INDEX wishlist_user_idx ON wishlist COLUMNS user, name UNIQUE;

-- Define permissions for security
DEFINE SCOPE account SESSION 24h
    SIGNUP ( CREATE user SET email = $email, password = crypto::argon2::generate($password), first_name = $first_name, last_name = $last_name )
    SIGNIN ( SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(password, $password) )
;

-- Admin permissions
DEFINE SCOPE admin SESSION 8h
    SIGNIN ( SELECT * FROM user WHERE email = $email AND crypto::argon2::compare(password, $password) AND role = "admin" )
; 
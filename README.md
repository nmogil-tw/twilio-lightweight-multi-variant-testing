## How to Use This Function in Twilio Studio

1. **Deploy the Function to Twilio Functions**:
   - Copy this code to a new Twilio Function
   - Make sure to deploy it with public access (or use appropriate auth)

2. **In your Studio Flow**:
   - Add a "Run Function" widget
   - Configure it to call this function
   - Pass parameters like `experimentName` and optionally `persistentAssignment`

3. **Add a Split widget**:
   - After the function widget, add a Split widget
   - Create branches based on the `variant` returned by the function
   - Use `{{widgets.function.parsed.variant}}` as the variable to test

### Example Parameters to Pass

- `experimentName`: The name of the experiment to run (e.g., "welcomeMessage")
- `persistentAssignment`: Set to "true" if you want the same caller to always get the same variant

### Features

- Supports multiple experiments in one function
- Can do 50/50 splits or custom weighted distributions
- Optional persistent assignment based on caller's phone number
- Configurable through simple JSON in the function code

You can easily modify the experiment configurations in the code to match your specific testing needs.

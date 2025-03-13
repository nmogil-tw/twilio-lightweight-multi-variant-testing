/**
 * Twilio Function for A/B Testing Experiments
 * 
 * This function randomly assigns callers to experiment variants and can be used
 * in Twilio Studio Flows to create different caller experiences.
 *
 * @param {object} context - The Twilio Functions context object
 * @param {object} event - The event parameters from Twilio
 * @param {function} callback - The callback function to return results
 */

exports.handler = function(context, event, callback) {
  // Configure your experiments here
  const experiments = {
    // Simple A/B test (50/50 split)
    welcomeMessage: {
      variants: ['standard', 'new'],
      weights: [50, 50]  // Percentage weights (must sum to 100)
    },
    
    // Multi-variant test example (40/30/30 split)
    holdMusic: {
      variants: ['classical', 'jazz', 'ambient'],
      weights: [40, 30, 30]
    },
    
    // Add more experiments as needed
    menuOptions: {
      variants: ['detailed', 'concise'],
      weights: [50, 50]
    }
  };
  
  // Get caller information
  const callSid = event.CallSid || '';
  const caller = event.From || '';
  
  // Initialize response object
  const response = new Twilio.Response();
  response.appendHeader('Content-Type', 'application/json');
  
  // Determine which experiment to run
  let experimentName = event.experimentName;
  
  // If no experiment specified but a default was set in environment variables, use that
  if (!experimentName && context.DEFAULT_EXPERIMENT) {
    experimentName = context.DEFAULT_EXPERIMENT;
  }
  
  // If still no experiment specified, return an error
  if (!experimentName || !experiments[experimentName]) {
    response.setStatusCode(400);
    response.setBody({
      status: 'error',
      message: `Invalid or missing experiment name: ${experimentName}`,
      validExperiments: Object.keys(experiments)
    });
    return callback(null, response);
  }
  
  // Select the experiment
  const experiment = experiments[experimentName];
  
  // Store assigned variant (if a persistent variant was requested)
  let assignedVariant;
  
  // Check if we should use consistent assignment based on caller phone number
  const usePersistentAssignment = event.persistentAssignment === 'true';
  
  if (usePersistentAssignment && caller) {
    // Simple hash function to generate a number from the caller's phone number
    // This ensures the same caller always gets the same variant
    const phoneHash = hashPhoneNumber(caller);
    
    // Use the hash to deterministically assign a variant
    assignedVariant = getVariantFromHash(experiment, phoneHash);
  } else {
    // Random assignment
    assignedVariant = getRandomVariant(experiment);
  }
  
  // Build and return the response
  response.setStatusCode(200);
  response.setBody({
    status: 'success',
    experiment: experimentName,
    variant: assignedVariant,
    callSid: callSid,
    caller: caller,
    isPersistent: usePersistentAssignment
  });
  
  // Log this assignment (optional)
  console.log(`Experiment assignment: ${experimentName} -> ${assignedVariant} for caller ${caller}`);
  
  return callback(null, response);
};

/**
 * Simple hash function to generate a number from a phone number
 * @param {string} phoneNumber - The caller's phone number
 * @return {number} A hash value between 0-99
 */
function hashPhoneNumber(phoneNumber) {
  // Remove non-numeric characters
  const cleanNumber = phoneNumber.replace(/\D/g, '');
  
  // Take last 4 digits (or whatever's available)
  const lastDigits = cleanNumber.slice(-4);
  
  // Simple hash: sum the digit values and take modulo 100
  const hash = lastDigits.split('').reduce((sum, digit) => sum + parseInt(digit, 10), 0) % 100;
  
  return hash;
}

/**
 * Select a variant using weighted random selection
 * @param {object} experiment - The experiment configuration
 * @return {string} The selected variant
 */
function getRandomVariant(experiment) {
  // Get a random number between 0-99
  const rand = Math.floor(Math.random() * 100);
  
  // Initialize the cumulative weight
  let cumulativeWeight = 0;
  
  // Find which variant corresponds to this random number
  for (let i = 0; i < experiment.variants.length; i++) {
    cumulativeWeight += experiment.weights[i];
    if (rand < cumulativeWeight) {
      return experiment.variants[i];
    }
  }
  
  // Fallback (should never reach here if weights sum to 100)
  return experiment.variants[0];
}

/**
 * Deterministically select a variant based on a hash value
 * @param {object} experiment - The experiment configuration
 * @param {number} hash - A hash value between 0-99
 * @return {string} The selected variant
 */
function getVariantFromHash(experiment, hash) {
  // Initialize the cumulative weight
  let cumulativeWeight = 0;
  
  // Find which variant corresponds to this hash
  for (let i = 0; i < experiment.variants.length; i++) {
    cumulativeWeight += experiment.weights[i];
    if (hash < cumulativeWeight) {
      return experiment.variants[i];
    }
  }
  
  // Fallback (should never reach here if weights sum to 100)
  return experiment.variants[0];
}

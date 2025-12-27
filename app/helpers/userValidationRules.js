import { body } from "express-validator";
const userValidationRules = () => {
  return [
    body("email").isEmail().withMessage("Please enter a valid email address."),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long."),
    body("username").notEmpty().withMessage("Username is required."),
  ];
};

const productValidationRules = () => {
  return [
    body("name").notEmpty().withMessage("Product name is required."),
    // body('name').notEmpty().withMessage('Product name is required.')
  ];
};

export { userValidationRules, productValidationRules };

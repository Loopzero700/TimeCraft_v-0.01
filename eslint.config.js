import globals from "globals";

export default [
  {
    rules: {
      semi: "off",
    },
  },

  // ========================
  // Ignore folders
  // ========================
  {
    ignores: ["node_modules/", "public/vendor/", "dist/", "build/"],
  },

  // ========================
  // Backend (Node / Express)
  // ========================
  {
    files: ["**/*.js"],
    ignores: ["public/js/**"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error",
      eqeqeq: "error",
      semi: "off",
      "no-console": "off",
    },
  },

  // ========================
  // Frontend (Browser JS)
  // ========================
  {
    files: ["public/js/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.browser,

        Swal: "readonly",
        Razorpay: "readonly",
        $: "readonly",
        userData: "readonly",
        productData: "readonly",
        currentPage: "readonly",
        totalPages: "readonly",
        topProductsData: "readonly",
        topCategoriesData: "readonly",
        topBrandsData: "readonly",
        limit: "readonly",
        currentPageLimit: "readonly",
        offerId: "readonly",
        url: "readonly",
        Intl: "readonly",
        Chart: "readonly",
        Cropper: "readonly",
        lucide: "readonly",
        wishListData: "readonly"
      },
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error",
      eqeqeq: "error",
      semi: "off",
    },
  },
];

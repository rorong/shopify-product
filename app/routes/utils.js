export const extractProductId = (productID) => {
    const parts = productID.split('/');
    return parts[parts.length - 1];
  };
  
// Generate Random Number
const getRandomNumber = (num) => {
  return Math.floor(Math.random() * num + 1);
};

// Generate Random Text
const generateRandomText = (length) => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result;
};

// Generate Otp
const generateOtp = (digit = 6) => {
  let otp = "";
  for (let i = 0; i < digit; i++) {
    otp += Math.floor(Math.random() * 10);
  }
  return otp;
};

generateOtp(4);

export { getRandomNumber, generateRandomText, generateOtp };

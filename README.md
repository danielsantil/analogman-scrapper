# analogman-scrapper

A web scrapper to check Analogman products availability.

Steps

In command line
1. `npm install`
2. `node scrapper.js <PRODUCT_CODE> <SNOOZE_TIME> <EMAIL_ADDRESS>`

For example:
`node scrapper.js AMPOT 4 myemail@address.com`

where:
- `AMPOT` is the product code. See product-codes.txt for a list of available product codes
- `4` is the time in minutes the process will check again for product availability if it's not in stock
- `myemail@address.com` is the email address that will receive the notification if the product is in stock

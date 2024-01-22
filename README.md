# Camp Bot
A Puppeteer bot made for a friend to snipe camping spot reservartions on [recreation.gov](https://www.recreation.gov) away from whatever other bot is sniping camping spot reservations.  Bot currently only adds camp sites to cart.  The actual checkout will have to be done manually.

## Instructions
1. Clone repo. 
2. ```
   npm install
   ``` 
3. Create .env file at root level of project.  Add the following variables. 
   - `CAMP_SITE_ID` - The id of the camp site you are trying to reserve. 
   - `USER_NAME` - Your username you used to sign up for recreation.gov.  Most likely an email address. 
   - `PASSWORD` - Password for your account.
   - `CHECK_IN_DATE` - mm/dd/yyy ex. `'05/15/2024'` 
   - `CHECK_OUT_DATE` - mm/dd/yyy ex. `'05/17/2024'` 
   - `CRON_EXPRESSION` - How often you want the application to check for camp sites.  I was told by my friend that camp sites are released at 9 AM central time, which would be `'0 9 * * *'`.  If you want to run it at a different interval, feel free. [Cron helper app](https://crontab.guru/) 
   - `TIME_ZONE` - The time zone you will be running the bot in. eg. `'US/Central'`. [Complete list of valid timezones](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones) 
4. ```
   npm run start
   ``` 
   - The application will run at an interval set by the `CRON_EXPRESSION` environment variable.  If the bot succeeds in adding a campsite to your cart the window will stay open and you will have 15 minutes to complete the transaction.  If there are no sites available it will shut the browser window and try again when your cron expression tells it to. 
   - If you book a site make sure to shut down the app so it doesn't try to keep adding sites to your cart. 

    [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) 
#Hash Battle

###Live App:
`hash-battle.herokuapp.com`

###Disclaimer:
I have only run this on Google Chrome so to help ensure a smooth experience, please use Chrome.

###Requirements/Installation:
To run this locally, you first need to set up a virtual environment:

```$ virtualenv venv```

```$ . venv/bin/activate```

Then you need to install all the requirements needed for this project:

```$ pip install -r requirements.txt```

To start the server, in the app directory run:

```$ python manage.py runserver```

Before you can start battling hashtags, you need to start celery (in a separate terminal window, also in the app directory):

```$ celery -A app worker -l info```

Now you can go to `localhost:<port>`, where port usually defaults to 8000, and the app will authenticate you with your twitter account and you can start battling out hashes.

###Navigating:
After you are authenticated on the home page, you will be taken to localhost:<port>/home. Here you can enter up to 4 hashes and submit the form. You will be shown a modal where you can go back to make any changes or continue on to the battle. Once you get to the battle page, you may not see any tweets displayed yet but they will start coming in quickly depending on the popularity of the hashtags you chose. You can click either the right or the left arrows on the carousel to see the updating graph of total tweets. The graph is redrawn every time there is a new tweet which is about every 5 seconds. There is also a menu at the top right hand side of the graph which you can use to export the graph in a variety of formats. This is provided by the Highcharts exporting.js library. Whenever you feel that you are done with the battle, you can click the End Battle button at the bottom of the page. You will be shown a modal with the results and the winner. At this point, you can either choose to go back to continue on with the battle, or you can click Done to go back to the homepage with the form. Ending the battle terminates the celery tasks so you can start another battle right away.

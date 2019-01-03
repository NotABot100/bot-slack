
const { Builder, By, Key, until } = require('selenium-webdriver');
//
const credentials = require("./credentials.js");
const botV = "BotV5";

(async function example() {
    const memePages = ["https://www.reddit.com/r/memes/new/", "https://www.reddit.com/r/dankmemes/new/", "https://www.reddit.com/r/me_irl/new/"]
    var currMemePage = 0;
    const nextMemePage = function(){
        currMemePage++;
        if(currMemePage === memePages.length){
            currMemePage = 0
        }
        return memePages[currMemePage];
    }
    const getMeme = async function(){
        await driver.switchTo().window(windows[0]);
        var nextLink = nextMemePage();
        console.log(nextLink);
        await driver.get(nextLink);

        var memeTitle = await driver.executeScript(`return document.evaluate('//*[@id="SHORTCUT_FOCUSABLE_DIV"]/div/div/div/div/div[3]/div/div[2]/div/div/div/div[2]/div[2]/span/a/h2', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.innerText`);

        var memeImageLink = await driver.executeScript(`return document.evaluate('//*[@id="SHORTCUT_FOCUSABLE_DIV"]/div/div/div/div/div[3]/div/div[2]/div/div/div/div[2]/div[3]/div/div[2]/a/div/div/img', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.src`);
        
        var textToSay = "<p>" + botV + ": " + "(r/" + /(?<=https:\/\/www.reddit.com\/r\/)\w+/.exec(nextLink) + ") " + memeTitle + "</p>" 
                            + memeImageLink
        
        await driver.switchTo().window(windows[2]);
        return textToSay;
    }


    /**
     * function to put the minutes with less than 1 number (0 to 9) with 2 numbers (00 to 09)
     * @param {int} number 
     */
    const twoNumbers = function(number){
        return (number).toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})
    }
    var predictableLeavingHours = "(pls use \"!rtime\" to refresh)";
    var foodTimeAlreadyDone = false;
    /**
     * Goes to WTM, sees the time and returns the time left (to do the 8 daily hours) as well as the predictable time at which we're going to reach those 8 hours
     * @param {boolean} refresh 
     */
    const getHours = async function(refresh){

        await driver.switchTo().window(windows[1]);
        //await new Promise(resolve => setTimeout(resolve, 1000));
        //await driver.get('http://insticc.org/WTM/Profile/ProfileIndex');
        console.log("--------------------------------------")
        var didntBugOut = false;
        while(!didntBugOut){
            try{
                var hours, minutes;
                for(var ii = 0; ii<5; ii++){
                    console.log("forLoop: " + ii);
                    await new Promise(resolve => setTimeout(resolve, 500));
                    hours = await driver.executeScript(`return parseInt(document.evaluate('//*[@id="checkInOut"]/table/tfoot/tr/td/text()', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.data.substring(1,3))`);
                    minutes = await driver.executeScript(`return parseInt(document.evaluate('//*[@id="checkInOut"]/table/tfoot/tr/td/text()', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.data.substring(6,8))`);
                    if((hours || hours===0) && (minutes || minutes===0)){
                        console.log("success")
                        console.log(hours, minutes)
                        didntBugOut = true;
                        ii=50;
                    }
                }
                if(!((hours || hours===0) && (minutes || minutes===0))){
                    console.log("fail")
                    console.log(hours, minutes)
                    await driver.get('http://insticc.org/WTM/Profile/ProfileIndex');
                }
            } catch(e) {
                console.log("error")
                console.log(e)
                console.log(hours, minutes)
                await driver.get('http://insticc.org/WTM/Profile/ProfileIndex');
            }
        }
        
        
        if(minutes === 0){
            hours--;
            minutes = 60;
        }
        
        if(refresh){
            let currDate = new Date();
            let minsLeft = currDate.getMinutes() + (60-minutes);
            let hoursLeft = currDate.getHours() + (7-hours);
            if(minsLeft >= 60){
                minsLeft -= 60;
                hoursLeft++;
            }
            predictableLeavingHours = "" + hoursLeft + "h" + twoNumbers(minsLeft) + "m";
        }
        var retVal;
        if(hours>=8){
            retVal="<p>" + botV + ": Go Go Go!</p>" + 
                    botV + ": You have" + (hours-8) + "h" + twoNumbers(minutes) + "m extra."
        } else{
            retVal = "<p>" + botV + ": " + (7-hours) + "h" + twoNumbers(60-minutes) + "m left</p>" + 
                        botV + ": Hora de saída prevista para as " + predictableLeavingHours;
        }
        console.log(hours + ":" + minutes);
        console.log(retVal);
        await driver.switchTo().window(windows[2]);
        return retVal
    }


    let driver = await new Builder().forBrowser('chrome').build();
    
    console.log("start")

    
    //opens slack and WTM in new tabs
    await driver.executeScript(`window.open("https://insticc.slack.com/", '_blank')`);
    await driver.executeScript(`window.open("http://insticc.org/WTM/Profile/ProfileIndex", '_blank')`);
    //gets the tabs opened to then control wich one we want to control
    var windows = await driver.getAllWindowHandles();
    console.log(windows)

    //selects the slack tab, logs in and selects the right chat
    //{
    await driver.switchTo().window(windows[2]);
    //wait bc the code that opens the new tab doesn't wait for it to load, and sometimes it gives an error bc u're trying to write stuff even before the site is loaded
    //Note: even with this code, it might give the error... needs refactor... something like what I did on WTM's authentication
    await new Promise(resolve => setTimeout(resolve, 2000));
    //Note: substitute the "slack's username" and "slack's password"
    await driver.findElement(By.id("email")).sendKeys(credentials.slackUserName, Key.TAB, credentials.slackPassword, Key.ENTER);
    //group: GDJM06JKA // mine: DAP91VCSH
    await driver.get('https://insticc.slack.com/messages/GDJM06JKA');
    //}


    //selects the WTM tab and logs in
    //{
    await driver.switchTo().window(windows[1]);
    //try to log in to WTM (sometimes it wouldn't work bc of the bug that opening new tabs doesn't wait for the pages to load, but this code fixes it)
    var complete = false;
    while(!complete){
        await new Promise(resolve => setTimeout(resolve, 500));
        try{
            //Note: substitute the "WTM's username" and "WTM's password"
            await driver.findElement(By.id("Username")).sendKeys(credentials.WTMUserName, Key.TAB, credentials.WTMPassword, Key.ENTER);
            complete = true;
        } catch(e){}
    }
    //}

    //switch back to the slack tab
    await driver.switchTo().window(windows[2]);

    var done = false

    //for each second, it sees if the last thing typed was either "!time" or "!rtime", and if it is, it gets the time left and displays it
    for(var i = 1; i>0; i++){
        //wait one second
        await new Promise(resolve => setTimeout(resolve, 980));
        //sees last phrase said
        var phraseSaid = await driver.executeScript(`return document.getElementsByClassName("c-message__body")[document.getElementsByClassName("c-message__body").length-1].textContent`);
        console.log(i, phraseSaid);
        var foodTime = false;
        if(!foodTimeAlreadyDone){
            var dateNow = new Date();
            var foodTime = dateNow.getHours() === 12 && !foodTimeAlreadyDone;
        }
        if(phraseSaid === "!time" || phraseSaid === "!rtime" || phraseSaid === "worst bot ever!" || phraseSaid === "!shame" || foodTime || phraseSaid === "!meme" || phraseSaid === "!gitclone"){
            //gets time and says it on slack (repeats while it isn't successful doing it)
            while(!done){
                //try{
                    var textoADizer
                    if(foodTime){
                        textoADizer = botV + ": It's 12:00";
                        foodTimeAlreadyDone = true;
                    }else{
                        if(phraseSaid === "!shame"){
                            textoADizer = botV + ": Shame on you!";
                        } else if(phraseSaid === "!meme"){
                            textoADizer = await getMeme();
                        } else if(phraseSaid === "!gitclone") {
                            textoADizer = `
                                I now exist in git!
                                To clone me, just follow these steps:
                                1- Open VSCode
                                2- Press ctrl + p
                                3- Type ">Git: Clone", then press enter
                                4- Type "https://github.com/NotABot100/bot-slack.git", then press enter
                                5- Choose the folder where you want the project to be cloned in
                                6- On the bottom right corner, there's going to be a popup that asks you if you want to open the project you just cloned. Accept it. If you don't see it, you can just open the project the normal way (File -> Open Folder)
                                7- In the cloned project, press ctrl + ç (to open the terminal)
                                8- Type "npm install"
                                9- Go to the "credentials.js" file, and type your slack and WTM username and password. When committing your changes, git will ignore this file (along with the whole node_modules folder)
                                10- You're set! just type "node bot.js" whenever you want to run the bot!
                                `;
                        } else {
                            textoADizer = phraseSaid === "worst bot ever!"? botV + ": You can do your own, you have the code, you lazy ass." : await getHours(phraseSaid === "!rtime");
                        }
                    }
                    console.log("texto a dizer: ", textoADizer);
                    
                    await driver.executeScript(" document.evaluate(`//*[@id='msg_input']/div[1]`, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.innerHTML=`" + textoADizer + "`;");
                    
                    console.log("ok");
                    done=true
                    //driver.findElement(By.xpath(`//*[@id="msg_input"]/div[1]`)).sendKeys(Key.ENTER); //doesn't work, idk why
                    //send the message  (this might not send it the first time, to I copy-pasted it a few times)
                    //Note: this is sloppy and it leads to the bug where, if u type something right after it sends the message, it will send what u typed right after)
                    await driver.executeScript(`document.evaluate("//*[@id='msg_input']/div[1]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.dispatchEvent(new KeyboardEvent('keydown', {
                        bubbles: true, cancelable: true, keyCode: 13
                    }));`);
                    await driver.executeScript(`document.evaluate("//*[@id='msg_input']/div[1]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.dispatchEvent(new KeyboardEvent('keydown', {
                        bubbles: true, cancelable: true, keyCode: 13
                    }));`);
                    await driver.executeScript(`document.evaluate("//*[@id='msg_input']/div[1]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.dispatchEvent(new KeyboardEvent('keydown', {
                        bubbles: true, cancelable: true, keyCode: 13
                    }));`);
                    await driver.executeScript(`document.evaluate("//*[@id='msg_input']/div[1]", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.dispatchEvent(new KeyboardEvent('keydown', {
                        bubbles: true, cancelable: true, keyCode: 13
                    }));`);
                //} catch(e){
                    
                //}
                console.log(done);
            }
        }
        done=false;
    }


    console.log("end")
    
})();
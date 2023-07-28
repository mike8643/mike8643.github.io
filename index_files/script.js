/*********************************************
Initialization...
*********************************************/

document.querySelector("#total").innerHTML = "Loading data...";
document.querySelector("#usd").innerHTML = "Loading data...";
document.querySelector("#cum").innerHTML = "Loading data...";
document.querySelector("#nim").innerHTML = "Loading data...";
document.querySelector("#str").innerHTML = "Loading data...";
document.querySelector("#titan").innerHTML = "Loading data...";

var cumVPSCost, nimVPSCost, strVPSCost;
    cumVPSCost = nimVPSCost = strVPSCost = 0;

var cumOwnedNodes, nimOwnedNodes, strOwnedNodes, nbOwnedNodes;
    cumOwnedNodes = nimOwnedNodes = strOwnedNodes = nbOwnedNodes = 0;

var cumMonthProfit, nimMonthProfit, strMonthProfit;
    cumMonthProfit = nimMonthProfit = strMonthProfit = 0;

var cumCollateral, nimCollateral, strCollateral;
    cumCollateral = nimCollateral = strCollateral = 0;

var cumFluxMonth, nimFluxMonth, strFluxMonth;
    cumFluxMonth = nimFluxMonth = strFluxMonth = 0;

var grandProfit, totalFluxMonth, requiredCollateral, totalVPSCost;
    grandProfit = totalFluxMonth = requiredCollateral = totalVPSCost = 0;

var cumFluxInit, nimFluxInit, strFluxInit, cumFluxInitCur, nimFluxInitCur, strFluxInitCur;
    cumFluxInit = nimFluxInit = strFluxInit = cumFluxInitCur = nimFluxInitCur = strFluxInitCur = 0;

var fluxCustomPrice, lockedFlux;
    fluxCustomPrice = lockedFlux = 0;

var isRefreshTriggered = false;
var cur = 0;
var curRadio = "USD";
var rankRadioValue = "IP";
var vpsCost = 0;
var aprFluxMonth = 0;
var paValue = 10 / 9;

/*********************************************
Main function - Called at website opening
*********************************************/

function start() {

    /*************************************
    Get Flux nodes data from Flux API
    *************************************/

    let urlFluxNodesCount = "https://api.runonflux.io/daemon/getzelnodecount";

    fetch(urlFluxNodesCount).then((response) => 
        response.json().then((donnees) => {

            document.querySelector("#total").innerHTML = `${donnees.data.total}`;
            document.querySelector("#cum").innerHTML = `${donnees.data["cumulus-enabled"]}`;
            document.querySelector("#nim").innerHTML = `${donnees.data["nimbus-enabled"]}`;
            document.querySelector("#str").innerHTML = `${donnees.data["stratus-enabled"]}`;

            /*******************************************************************
            Function to get FLUX prices in various currencies from Coingecko API
            *******************************************************************/

            let urlCurrencies = "https://api.coingecko.com/api/v3/simple/price?ids=zelcash&vs_currencies=usd%2Ceur%2Cgbp%2Cchf";

            getCurrencies(urlCurrencies);
            rankRadio();

            var urlTitanNodes = "https://api.titan.runonflux.io/nodes";
            getTitanNodes(urlTitanNodes);

            async function getCurrencies(urlCurrencies) {
                const responseCur = await fetch(urlCurrencies);
                var dataCur = await responseCur.json();

                /***********************************************
                Calculate rewards and profit for 1 owned node
                ***********************************************/

                if (responseCur) {

                    curPriceUSD = dataCur.zelcash.usd;
                    curPriceEUR = dataCur.zelcash.eur;
                    curPriceGBP = dataCur.zelcash.gbp;
                    curPriceCHF = dataCur.zelcash.chf;

                    document.querySelector("#usd").innerHTML = currencyFormat(curPriceUSD, "USD");
                    document.querySelector("#eur").innerHTML = currencyFormat(curPriceEUR, "EUR");
                    document.querySelector("#gbp").innerHTML = currencyFormat(curPriceGBP, "GBP");
                    document.querySelector("#chf").innerHTML = currencyFormat(curPriceCHF, "CHF");

                    cum = donnees.data["cumulus-enabled"];
                    nim = donnees.data["nimbus-enabled"];
                    str = donnees.data["stratus-enabled"];

                    timeToReward("cum", cum);
                    timeToReward("nim", nim);
                    timeToReward("str", str);

                    lockedSupply = (cum * 1000) + (nim * 12500) + (str * 40000);
                    document.querySelector("#total_locked_supply").innerHTML = lockedSupply.toLocaleString();
                    document.querySelector("#cum_locked_supply").innerHTML = (cum * 1000).toLocaleString();
                    document.querySelector("#nim_locked_supply").innerHTML = (nim * 12500).toLocaleString();
                    document.querySelector("#str_locked_supply").innerHTML = (str * 40000).toLocaleString();

                    calcTitanAPR();

                    if (isRefreshTriggered === true) {

                        apr("cum", cum);                   
                        apr("nim", nim);
                        apr("str", str);

                        if (cumOwnedNodes != 0 ) {
                            if (fluxCustomPrice != 0) {
                                calculate("cum", cum, fluxCustomPrice, curRadio, cumOwnedNodes, cumVPSCost);
                            }
                            else {
                                calculate("cum", cum, cur, curRadio, cumOwnedNodes, cumVPSCost);
                            }
                        } else {
                            initCumulus(curRadio);
                        }

                        if (nimOwnedNodes != 0 ) {
                            if (fluxCustomPrice != 0) {
                                calculate("nim", nim, fluxCustomPrice, curRadio, nimOwnedNodes, nimVPSCost);
                            }
                            else {
                                calculate("nim", nim, cur, curRadio, nimOwnedNodes, nimVPSCost);
                            }
                        } else {
                            initNimbus(curRadio);
                        }

                        if (strOwnedNodes != 0 ) {
                            if (fluxCustomPrice != 0) {
                                calculate("str", str, fluxCustomPrice, curRadio, strOwnedNodes, strVPSCost);
                            }
                            else {
                                calculate("str", str, cur, curRadio, strOwnedNodes, strVPSCost);
                            }
                        } else {
                            initStratus(curRadio);
                        }

                        titanProfitCalc();

                    } else {

                        cur = curPriceUSD;

                        apr("cum", cum);                   
                        apr("nim", nim);
                        apr("str", str);

                        reset();
                    }
                }
            }
        })
        .catch((error) => {
            console.log("There is an issue with fetch operation for FLUX nodes: " + error.message);
        })
    );
}


/*********************************************
Function to get number of Titan nodes
*********************************************/

async function getTitanNodes(urlTitanNodes) {
    const responseTitanNodes = await fetch(urlTitanNodes);
    var titanNodes = await responseTitanNodes.json();

    if (titanNodes) {
        document.querySelector("#titan").innerHTML = `${titanNodes.length}`;
        document.querySelector("#titan_locked_up").innerHTML = (titanNodes.length * 40000).toLocaleString();

        const titanLast3 = titanNodes.slice(-3);

        for (var i = 0; i < 3; i++) {
            document.getElementById(`titan_last${i}_name`).innerHTML = titanLast3[i]["name"];
            document.getElementById(`titan_last${i}_location`).innerHTML = titanLast3[i]["location"];
            document.getElementById(`titan_last${i}_created`).innerHTML = new Date(titanLast3[i]["created"]).toLocaleDateString();
        }
    }

    var urlTitanStats = "https://api.titan.runonflux.io/stats";
    getTitanStats(urlTitanStats);
}


/*********************************************
Function to get stats on Titan
*********************************************/

async function getTitanStats(urlTitanStats) {
    const responseTitanStats = await fetch(urlTitanStats);
    var titanStats = await responseTitanStats.json();

    if (titanStats) {
        titanStakingTotal = titanStats.total;
        titanStakingTotal = Number(titanStakingTotal.toFixed(0));
        document.querySelector("#titan_staking_total").innerHTML = titanStakingTotal.toLocaleString();
    }
}


/***************************************************************
Function to calculate Titan APR (based on nb of Stratus nodes)
***************************************************************/

async function calcTitanAPR() {

    titanAPR3M = (((1 + ((((30 * (720 / str)) * ((11.25 * (100 - 20)) / 100) / 40000)) * 12) / 12) ** 12) - 1)
    titanAPR3M = Number(titanAPR3M * 100).toFixed(2);
    document.querySelector("#titan_apr_3m").innerHTML = titanAPR3M + "%";
    
    titanAPR6M = (((1 + ((((30 * (720 / str)) * ((11.25 * (100 - 15)) / 100) / 40000)) * 12) / 12) ** 12) - 1)
    titanAPR6M = Number(titanAPR6M * 100).toFixed(2);
    document.querySelector("#titan_apr_6m").innerHTML = titanAPR6M + "%";
    
    titanAPR12M = (((1 + ((((30 * (720 / str)) * ((11.25 * (100 - 10)) / 100) / 40000)) * 12) / 12) ** 12) - 1)
    titanAPR12M = Number(titanAPR12M * 100).toFixed(2);
    document.querySelector("#titan_apr_12m").innerHTML = titanAPR12M + "%";
}


/*********************************************
Function to calculate the APR
*********************************************/

function apr(tier, nbNodes) {

    const fluxReward = { cum: 2.8125, nim: 4.6875, str: 11.25 };
    const fluxCollateral = { cum: 1000, nim: 12500, str: 40000 };

    aprFluxMonth = ((43200 / (nbNodes * 2)) * fluxReward[tier]);

    aprCalc = Number((((aprFluxMonth + aprFluxMonth / 2) * cur) * 12) / (fluxCollateral[tier] * cur) * 100).toFixed(2);
    document.getElementById(`${tier}_apr`).innerHTML = `${aprCalc}%`;
}


/*********************************************
Function to reset all data
*********************************************/

async function reset() {

    curRadio = document.querySelector('input[name="currencyChoice"]:checked').value;

    if (curRadio === "USD") {
        cur = curPriceUSD;
        document.getElementById("flux_price").innerHTML = "FLUX price (USD):";
        document.getElementById("flux_price_cur").innerHTML = currencyFormat(curPriceUSD, curRadio);
        document.getElementById("custom_price").innerHTML = "<b>Custom</b> FLUX price (USD):";
    } else if (curRadio === "EUR") {
        cur = curPriceEUR;
        document.getElementById("flux_price").innerHTML = "FLUX price (EUR):";
        document.getElementById("flux_price_cur").innerHTML = currencyFormat(curPriceEUR, curRadio);
        document.getElementById("custom_price").innerHTML = "<b>Custom</b> FLUX price (EUR):";
    } else if (curRadio === "GBP") {
        cur = curPriceGBP;
        document.getElementById("flux_price").innerHTML = "FLUX price (GBP):";
        document.getElementById("flux_price_cur").innerHTML = currencyFormat(curPriceGBP, curRadio);
        document.getElementById("custom_price").innerHTML = "<b>Custom</b> FLUX price (GBP):";
    } else if (curRadio === "CHF") {
        cur = curPriceCHF;
        document.getElementById("flux_price").innerHTML = "FLUX price (CHF):";
        document.getElementById("flux_price_cur").innerHTML = currencyFormat(curPriceCHF, curRadio);
        document.getElementById("custom_price").innerHTML = "<b>Custom</b> FLUX price (CHF):";
    }

    document.getElementById("custom_price_input").value = "";
    fluxCustomPrice = 0;

    initCumulus(curRadio);
    initNimbus(curRadio);
    initStratus(curRadio);

    cumOwnedNodes = nimOwnedNodes = strOwnedNodes = 0;
    cumMonthProfit = nimMonthProfit = strMonthProfit = 0;
    cumCollateral = nimCollateral = strCollateral = 0;
    cumVPSCost = nimVPSCost = strVPSCost = 0;
    cumFluxMonth = nimFluxMonth = strFluxMonth = 0;
    totalVPSCost = grandProfit = totalFluxMonth = requiredCollateral = 0;

    document.getElementById("cum_profit").innerHTML = currencyFormat(cumMonthProfit, curRadio);
    document.getElementById("cum_collateral").innerHTML = 0;
    document.getElementById("cum_collateral_cur").innerHTML= "";

    document.getElementById("nim_profit").innerHTML = currencyFormat(nimMonthProfit, curRadio);
    document.getElementById("nim_collateral").innerHTML = 0;
    document.getElementById("nim_collateral_cur").innerHTML= "";

    document.getElementById("str_profit").innerHTML = currencyFormat(strMonthProfit, curRadio);
    document.getElementById("str_collateral").innerHTML = 0;
    document.getElementById("str_collateral_cur").innerHTML= "";

    document.getElementById("cum_nodes_slider").value = 0;
    document.getElementById("cum_nodes").innerHTML = 0;
    document.getElementById("cum_node_section").innerHTML = 1;   
    document.getElementById("cum_vps_input").value = "";

    document.getElementById("nim_nodes_slider").value = 0;
    document.getElementById("nim_nodes").innerHTML = 0;
    document.getElementById("nim_node_section").innerHTML = 1;   
    document.getElementById("nim_vps_input").value = "";

    document.getElementById("str_nodes_slider").value = 0;
    document.getElementById("str_nodes").innerHTML = 0;
    document.getElementById("str_node_section").innerHTML = 1;   
    document.getElementById("str_vps_input").value = "";

    document.getElementById("grand_profit").innerHTML = currencyFormat(0, curRadio);
    document.getElementById("required_collateral").innerHTML = 0;
    document.getElementById("required_collateral_cur").innerHTML = "";
    document.getElementById("flux_month_total").innerHTML = "0.00";
    document.getElementById("total_vps_cost").innerHTML = currencyFormat(0, curRadio);

    document.getElementById("titan_reward").innerHTML = "0.00 FLUX";
    document.getElementById("titan_profit").innerHTML = currencyFormat(0, curRadio);
    document.getElementById("titan_locked_flux").value = "";
    titanMonthlyReward = 0;
}


/****************************************************
Function refresh to update currencies and calculation
****************************************************/

function refresh() {

    cumOwnedNodes = Number(document.getElementById("cum_nodes").innerHTML);
    nimOwnedNodes = Number(document.getElementById("nim_nodes").innerHTML);
    strOwnedNodes = Number(document.getElementById("str_nodes").innerHTML);

    lockedFlux = document.getElementById("titan_locked_flux").value;
    lockedPeriod = document.querySelector('input[name="lockupChoice"]:checked').value;
    lockedPeriod = Number(lockedPeriod);

    fluxCustomPrice = document.getElementById("custom_price_input").value;
    fluxCustomPrice = Number(fluxCustomPrice.replace("," , "."));

    isRefreshTriggered = true;

    start(isRefreshTriggered);
}


/*********************************************
Function to change currency (radio button)
*********************************************/

function currency(curRadio) {

    curRadio = curRadio.value;

    if (curRadio === "USD") {
        cur = curPriceUSD;
        document.getElementById("flux_price").innerHTML = "FLUX price (USD):";
        document.getElementById("flux_price_cur").innerHTML = currencyFormat(curPriceUSD, curRadio);
        document.getElementById("custom_price").innerHTML = "<b>Custom</b> FLUX price (USD):";
    } else if (curRadio === "EUR") {
        cur = curPriceEUR;
        document.getElementById("flux_price").innerHTML = "FLUX price (EUR):";
        document.getElementById("flux_price_cur").innerHTML = currencyFormat(curPriceEUR, curRadio);
        document.getElementById("custom_price").innerHTML = "<b>Custom</b> FLUX price (EUR):";
    } else if (curRadio === "GBP") {
        cur = curPriceGBP;
        document.getElementById("flux_price").innerHTML = "FLUX price (GBP):";
        document.getElementById("flux_price_cur").innerHTML = currencyFormat(curPriceGBP, curRadio);
        document.getElementById("custom_price").innerHTML = "<b>Custom</b> FLUX price (GBP):";
    } else if (curRadio === "CHF") {
        cur = curPriceCHF;
        document.getElementById("flux_price").innerHTML = "FLUX price (CHF):";
        document.getElementById("flux_price_cur").innerHTML = currencyFormat(curPriceCHF, curRadio);
        document.getElementById("custom_price").innerHTML = "<b>Custom</b> FLUX price (CHF):";
    }

    if (cumOwnedNodes != 0 ) {
        calculate("cum", cum, cur, curRadio, cumOwnedNodes, cumVPSCost);
    } else {
        initCumulus(curRadio);
    }

    if (nimOwnedNodes != 0 ) {
        calculate("nim", nim, cur, curRadio, nimOwnedNodes, nimVPSCost);
    } else {
        initNimbus(curRadio);
    }

    if (strOwnedNodes != 0 ) {
        calculate("str", str, cur, curRadio, strOwnedNodes, strVPSCost);
    } else {
        initStratus(curRadio);
    }

    titanProfitCalc();
}


/*********************************************
Function to calculate profit for Titan staking
*********************************************/

lockedFlux = document.getElementById("titan_locked_flux");

lockedFlux.oninput = function() {
    
    lockedFlux = this.value;

    if(isNaN(lockedFlux)) {
        document.getElementById("locked_flux").innerHTML = "<b>Only integer!</b>";
        document.getElementById("titan_locked_flux").value = "";
        return;
    } else {
        document.getElementById("locked_flux").innerHTML = "FLUX locked:";
        titanProfitCalc();
    } 
}

async function titanProfitCalc() {

    curRadio = document.querySelector('input[name="currencyChoice"]:checked').value;

    fluxCustomPrice = document.getElementById("custom_price_input").value;
    fluxCustomPrice = Number(fluxCustomPrice.replace("," , "."));

    lockedFlux = document.getElementById("titan_locked_flux").value;
    lockedPeriod = document.querySelector('input[name="lockupChoice"]:checked').value;
    lockedPeriod = Number(lockedPeriod);

    if (lockedPeriod == 3) {
        titanMonthlyReward = (lockedFlux * titanAPR3M / 100) / 12;
    } else if (lockedPeriod == 6) {
        titanMonthlyReward = (lockedFlux * titanAPR6M / 100) / 12;
    } else if (lockedPeriod == 12) {
        titanMonthlyReward = (lockedFlux * titanAPR12M / 100) / 12;
    }

    document.getElementById("flux_locked").innerHTML = lockedFlux;

    titanMonthlyReward = Number(titanMonthlyReward);
    document.getElementById("titan_reward").innerHTML = `${titanMonthlyReward.toFixed(2)} FLUX`;

    if (fluxCustomPrice != 0) {
        document.getElementById("titan_profit").innerHTML = currencyFormat((titanMonthlyReward * fluxCustomPrice), curRadio);
        document.getElementById("flux_locked_cur").innerHTML = ` (${currencyFormat((lockedFlux * fluxCustomPrice), curRadio)})`;
    }
    else {
        document.getElementById("titan_profit").innerHTML = currencyFormat((titanMonthlyReward * cur), curRadio);
        document.getElementById("flux_locked_cur").innerHTML = ` (${currencyFormat((lockedFlux * cur), curRadio)})`;
    }

    curTemp = curRadio;

    total(titanMonthlyReward, curTemp);
}


/****************************************************
Functions to calculate rewards for 1 node (default)
****************************************************/

function initCumulus(curRadio) {
    cumFluxInit = ((43200 / (cum * 2)) * 2.8125);

    if (fluxCustomPrice != 0) {
        cumFluxInitCur = cumFluxInit * fluxCustomPrice;
    } else {
        cumFluxInitCur = cumFluxInit * cur;
    }
    
    document.getElementById(`cum_flux_day`).innerHTML = `<b>${(cumFluxInit / 30).toFixed(2)} FLUX</b>/day <pareward>(${currencyFormat(cumFluxInitCur / 30, curRadio)})</pareward><br>
    <pareward>+ <b>${((cumFluxInit / 30) / paValue).toFixed(2)} FLUX Tokens/PA</b> (${currencyFormat((cumFluxInitCur / 30) / paValue, curRadio)})</pareward>`;
    
    document.getElementById(`cum_flux_month`).innerHTML = `<b>${(cumFluxInit).toFixed(2)} FLUX</b>/month <pareward>(${currencyFormat(cumFluxInitCur, curRadio)})</pareward><br>
    <pareward>+ <b>${((cumFluxInit) / paValue).toFixed(2)} FLUX Tokens/PA</b> (${currencyFormat((cumFluxInitCur) / paValue, curRadio)})</pareward>`;

    document.getElementById("cum_profit").innerHTML = currencyFormat(cumMonthProfit, curRadio);
    document.getElementById("total_vps_cost").innerHTML = currencyFormat(totalVPSCost, curRadio);
    document.getElementById("grand_profit").innerHTML = currencyFormat(grandProfit, curRadio);
}

function initNimbus(curRadio) {
    nimFluxInit = ((43200 / (nim * 2)) * 4.6875);

    if (fluxCustomPrice != 0) {
        nimFluxInitCur = nimFluxInit * fluxCustomPrice;
    } else {
        nimFluxInitCur = nimFluxInit * cur;
    }
    
    document.getElementById(`nim_flux_day`).innerHTML = `<b>${(nimFluxInit / 30).toFixed(2)} FLUX</b>/day <pareward>(${currencyFormat(nimFluxInitCur / 30, curRadio)})</pareward><br>
    <pareward>+ <b>${((nimFluxInit / 30) / paValue).toFixed(2)} FLUX Tokens/PA</b> (${currencyFormat((nimFluxInitCur / 30) / paValue, curRadio)})</pareward>`;
    
    document.getElementById(`nim_flux_month`).innerHTML = `<b>${(nimFluxInit).toFixed(2)} FLUX</b>/month <pareward>(${currencyFormat(nimFluxInitCur, curRadio)})</pareward><br>
    <pareward>+ <b>${((nimFluxInit) / paValue).toFixed(2)} FLUX Tokens/PA</b> (${currencyFormat((nimFluxInitCur) / paValue, curRadio)})</pareward>`;

    document.getElementById("nim_profit").innerHTML = currencyFormat(nimMonthProfit, curRadio);
    document.getElementById("total_vps_cost").innerHTML = currencyFormat(totalVPSCost, curRadio);
    document.getElementById("grand_profit").innerHTML = currencyFormat(grandProfit, curRadio);
}

function initStratus(curRadio) {
    strFluxInit = ((43200 / (str * 2)) * 11.25);

    if (fluxCustomPrice != 0) {
        strFluxInitCur = strFluxInit * fluxCustomPrice;
    } else {
        strFluxInitCur = strFluxInit * cur;
    }

    document.getElementById(`str_flux_day`).innerHTML = `<b>${(strFluxInit / 30).toFixed(2)} FLUX</b>/day <pareward>(${currencyFormat(strFluxInitCur / 30, curRadio)})</pareward><br>
    <pareward>+ <b>${((strFluxInit / 30) / paValue).toFixed(2)} FLUX Tokens/PA</b> (${currencyFormat((strFluxInitCur / 30) / paValue, curRadio)})</pareward>`;
    
    document.getElementById(`str_flux_month`).innerHTML = `<b>${(strFluxInit).toFixed(2)} FLUX</b>/month <pareward>(${currencyFormat(strFluxInitCur, curRadio)})</pareward><br>
    <pareward>+ <b>${((strFluxInit) / paValue).toFixed(2)} FLUX Tokens/PA</b> (${currencyFormat((strFluxInitCur) / paValue, curRadio)})</pareward>`;

    document.getElementById("str_profit").innerHTML = currencyFormat(strMonthProfit, curRadio);
    document.getElementById("total_vps_cost").innerHTML = currencyFormat(totalVPSCost, curRadio);
    document.getElementById("grand_profit").innerHTML = currencyFormat(grandProfit, curRadio);
}


/*********************************************
Function to use the correct currency format
*********************************************/

function currencyFormat(number, curRadio) {

    if (curRadio === "USD") {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(number);
    }
    else if (curRadio === "EUR") {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(number);
    }
    else if (curRadio === "GBP") {
        return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(number);
    }
    else if (curRadio === "CHF") {
        return new Intl.NumberFormat('fr-CH', { style: 'currency', currency: 'CHF' }).format(number);
    }
}


/*********************************************
Function to calculate delay between rewards
*********************************************/

function timeToReward(tier, nbNodes) {

    day = Math.floor((nbNodes * 2) / 1440);
    hour = Math.floor(((nbNodes * 2) - day * 1440) / 60);
    minute = (nbNodes * 2) - (day * 1440) - (hour * 60);

    dayDisplay = day > 0 ? day + (day == 1 ? " day, " : " days, ") : "";
    hourDisplay = hour > 0 ? hour + (hour == 1 ? " hr and " : " hrs and ") : "";
    minuteDisplay = minute > 0 ? minute + (minute == 1 ? " minute" : " minutes") : "";

    rewardDelay = dayDisplay + hourDisplay + minute + " min";
    document.getElementById(`${tier}_payout_delay`).innerHTML = rewardDelay;

    rewardPerMonth(tier, nbNodes);
}


/***********************************************
Function to calculate number of reward per month
***********************************************/

function rewardPerMonth(tier, nbNodes) {

    rewPerMonth = (43200 / (nbNodes * 2)).toFixed(1);
    document.getElementById(`${tier}_rew`).innerHTML =`<b>~${rewPerMonth}</b>`;
}


/************************************************
CUMULUS slider to recalculate rewards & profit
************************************************/

cumSlider = document.getElementById("cum_nodes_slider");
outputOwnedCumulus = document.getElementById("cum_nodes");
outputOwnedCumulus.innerHTML = cumSlider.value;

cumSlider.oninput = function() {

    outputOwnedCumulus.innerHTML = this.value;
    cumOwnedNodes = parseInt(outputOwnedCumulus.innerHTML);

    curRadio = document.querySelector('input[name="currencyChoice"]:checked').value;

    fluxCustomPrice = document.getElementById("custom_price_input").value;
    fluxCustomPrice = Number(fluxCustomPrice.replace("," , "."));

    document.getElementById("cum_node_section").innerHTML = cumOwnedNodes;

    if (cumOwnedNodes === 0) {
        calculate("cum", cum, cur, curRadio, 0, cumVPSCost);
        cumMonthProfit = cumFluxMonth = cumCollateral = 0;
        requiredCollateral = requiredCollateral - cumCollateral;
    } else if (cumOwnedNodes != 0) {
        if (fluxCustomPrice != 0) {
            calculate("cum", cum, fluxCustomPrice, curRadio, cumOwnedNodes, cumVPSCost);
        }
        else {
            calculate("cum", cum, cur, curRadio, cumOwnedNodes, cumVPSCost);
        }
    }
}


/************************************************
NIMBUS slider to recalculate rewards & profit
************************************************/

nimSlider = document.getElementById("nim_nodes_slider");
outputOwnedNimbus = document.getElementById("nim_nodes");
outputOwnedNimbus.innerHTML = nimSlider.value;

nimSlider.oninput = function() {

    outputOwnedNimbus.innerHTML = this.value;
    nimOwnedNodes = parseInt(outputOwnedNimbus.innerHTML);
    
    curRadio = document.querySelector('input[name="currencyChoice"]:checked').value;

    fluxCustomPrice = document.getElementById("custom_price_input").value;
    fluxCustomPrice = Number(fluxCustomPrice.replace("," , "."));

    document.getElementById("nim_node_section").innerHTML = nimOwnedNodes;

    if (nimOwnedNodes === 0) {
        calculate("nim", nim, cur, curRadio, 0, nimVPSCost);
        nimMonthProfit = nimFluxMonth = nimCollateral = 0;
        requiredCollateral = requiredCollateral - nimCollateral;
    } else if (nimOwnedNodes != 0) {
        if (fluxCustomPrice != 0) {
            calculate("nim", nim, fluxCustomPrice, curRadio, nimOwnedNodes, nimVPSCost);
        }
        else {
            calculate("nim", nim, cur, curRadio, nimOwnedNodes, nimVPSCost);
        }
    }
}


/************************************************
STRATUS slider to recalculate rewards & profit
************************************************/

strSlider = document.getElementById("str_nodes_slider");
outputOwnedStratus = document.getElementById("str_nodes");
outputOwnedStratus.innerHTML = strSlider.value;

strSlider.oninput = function() {

    outputOwnedStratus.innerHTML = this.value;
    strOwnedNodes = parseInt(outputOwnedStratus.innerHTML);
    
    curRadio = document.querySelector('input[name="currencyChoice"]:checked').value;

    fluxCustomPrice = document.getElementById("custom_price_input").value;
    fluxCustomPrice = Number(fluxCustomPrice.replace("," , "."));

    document.getElementById("str_node_section").innerHTML = strOwnedNodes;

    if (strOwnedNodes === 0) {
        calculate("str", str, cur, curRadio, 0, strVPSCost);
        strMonthProfit = strFluxMonth = strCollateral = 0;
        requiredCollateral = requiredCollateral - strCollateral;
    } else if (strOwnedNodes != 0) {
        if (fluxCustomPrice != 0) {
            calculate("str", str, fluxCustomPrice, curRadio, strOwnedNodes, strVPSCost);
        }
        else {
            calculate("str", str, cur, curRadio, strOwnedNodes, strVPSCost);
        }
    }
}


/*****************************************************
Recalculate rewards & profit based on hosting/VPS cost
*****************************************************/

cumVPSCost = document.getElementById("cum_vps_input");

cumVPSCost.oninput = function() {
    
    cumVPSCost = this.value;

    if(isNaN(cumVPSCost)) {
        document.getElementById("cum_vps").innerHTML = "<b>Only integer please</b>";
        document.getElementById("cum_vps_input").value = "";
        return;
    } else {
        document.getElementById("cum_vps").innerHTML = "Hosting cost:";
        calculate("cum", cum, cur, curRadio, cumOwnedNodes, cumVPSCost);
    } 
}

nimVPSCost = document.getElementById("nim_vps_input");

nimVPSCost.oninput = function() {

    nimVPSCost = this.value;

    if(isNaN(nimVPSCost)) {
        document.getElementById("nim_vps").innerHTML = "<b>Only integer please</b>";
        document.getElementById("nim_vps_input").value = "";
        return;
    } else {
        document.getElementById("nim_vps").innerHTML = "Hosting cost:";
        calculate("nim", nim, cur, curRadio, nimOwnedNodes, nimVPSCost);
    } 
}

strVPSCost = document.getElementById("str_vps_input");

strVPSCost.oninput = function() {

    strVPSCost = this.value;

    if(isNaN(strVPSCost)) {
        document.getElementById("str_vps").innerHTML = "<b>Only integer please</b>";
        document.getElementById("str_vps_input").value = "";
        return;
    } else {
        document.getElementById("str_vps").innerHTML = "Hosting cost:";
        calculate("str", str, cur, curRadio, strOwnedNodes, strVPSCost);
    } 
}

/***********************************************************************
Main function to calculate rewards & profit based on tier slider value
***********************************************************************/

async function calculate(tier, nbNodes, cur, curRadio, nbOwnedNodes, vpsCost) {

    const fluxReward = { cum: 2.8125, nim: 4.6875, str: 11.25 };
    const fluxCollateral = { cum: 1000, nim: 12500, str: 40000 };

    /****************************************************************
    Calculate the monthly profit and required collateral per tier
    ****************************************************************/

    if (tier === "cum") {

        if (fluxCustomPrice != 0) {
            cumMonthProfit = ((((43200 / (nbNodes * 2)) * fluxReward.cum) * cumOwnedNodes) * fluxCustomPrice);
        }
        else {
            cumMonthProfit = ((((43200 / (nbNodes * 2)) * fluxReward.cum) * cumOwnedNodes) * cur);
        }

        cumMonthProfit = Number(cumMonthProfit) + Number(cumMonthProfit / paValue);
        cumMonthProfit = cumMonthProfit - Number(vpsCost);

        document.getElementById("cum_profit").innerHTML = currencyFormat(cumMonthProfit, curRadio);

        cumCollateral = (fluxCollateral[tier] * cumOwnedNodes);
        document.getElementById(`${tier}_collateral`).innerHTML = cumCollateral.toLocaleString();

        if (fluxCustomPrice != 0) {
            document.getElementById(`${tier}_collateral_cur`).innerHTML=" (" + currencyFormat(cumCollateral * fluxCustomPrice, curRadio) + ")";
        }
        else {
            document.getElementById(`${tier}_collateral_cur`).innerHTML=" (" + currencyFormat(cumCollateral * cur, curRadio) + ")";
        }

        fluxMonth = (((43200 / (nbNodes * 2)) * fluxReward.cum)) * nbOwnedNodes;
        cumFluxMonth = Number(fluxMonth) + Number(fluxMonth / paValue);

        document.getElementById(`cum_reward`).innerHTML = `<b>${cumFluxMonth.toFixed(2)} FLUX`;

        curTemp = curRadio;
        total(cumMonthProfit, cumCollateral, cumFluxMonth, curTemp);

    } else if (tier === "nim") {

        if (fluxCustomPrice != 0) {
            nimMonthProfit = ((((43200 / (nbNodes * 2)) * fluxReward.nim) * nimOwnedNodes) * fluxCustomPrice);
        }
        else {
            nimMonthProfit = ((((43200 / (nbNodes * 2)) * fluxReward.nim) * nimOwnedNodes) * cur);
        }

        nimMonthProfit = Number(nimMonthProfit) + Number(nimMonthProfit / paValue);
        nimMonthProfit = nimMonthProfit - Number(vpsCost);

        document.getElementById("nim_profit").innerHTML = currencyFormat(nimMonthProfit, curRadio);

        nimCollateral = (fluxCollateral[tier] * nimOwnedNodes);
        document.getElementById(`${tier}_collateral`).innerHTML = nimCollateral.toLocaleString();

        if (fluxCustomPrice != 0) {
            document.getElementById(`${tier}_collateral_cur`).innerHTML=" (" + currencyFormat(nimCollateral * fluxCustomPrice, curRadio) + ")";
        }
        else {
            document.getElementById(`${tier}_collateral_cur`).innerHTML=" (" + currencyFormat(nimCollateral * cur, curRadio) + ")";
        }

        fluxMonth = (((43200 / (nbNodes * 2)) * fluxReward.nim)) * nbOwnedNodes;
        nimFluxMonth = Number(fluxMonth) + Number(fluxMonth / paValue);

        document.getElementById(`nim_reward`).innerHTML = `<b>${nimFluxMonth.toFixed(2)} FLUX`;

        curTemp = curRadio;
        total(nimMonthProfit, nimCollateral, nimFluxMonth, curTemp);

    } else if (tier === "str") {

        if (fluxCustomPrice != 0) {
            strMonthProfit = ((((43200 / (nbNodes * 2)) * fluxReward.str) * strOwnedNodes) * fluxCustomPrice);
        }
        else {
            strMonthProfit = ((((43200 / (nbNodes * 2)) * fluxReward.str) * strOwnedNodes) * cur);
        }

        strMonthProfit = Number(strMonthProfit) + Number((strMonthProfit / paValue));
        strMonthProfit = strMonthProfit - Number(vpsCost);
        
        document.getElementById("str_profit").innerHTML = currencyFormat(strMonthProfit, curRadio);

        strCollateral = (fluxCollateral[tier] * strOwnedNodes);
        document.getElementById(`${tier}_collateral`).innerHTML = strCollateral.toLocaleString();

        if (fluxCustomPrice != 0) {
            document.getElementById(`${tier}_collateral_cur`).innerHTML=" (" + currencyFormat(strCollateral * fluxCustomPrice, curRadio) + ")";
        }
        else {
            document.getElementById(`${tier}_collateral_cur`).innerHTML=" (" + currencyFormat(strCollateral * cur, curRadio) + ")";
        }

        fluxMonth = (((43200 / (nbNodes * 2)) * fluxReward.str)) * nbOwnedNodes;
        strFluxMonth = Number(fluxMonth) + Number(fluxMonth / paValue);

        document.getElementById(`str_reward`).innerHTML = `<b>${strFluxMonth.toFixed(2)} FLUX`;

        curTemp = curRadio;
        total(strMonthProfit, strCollateral, strFluxMonth, curTemp);
    }

    if (fluxCustomPrice != 0) {
        fluxMonthCurrency = fluxMonth * fluxCustomPrice;
    }
    else {
        fluxMonthCurrency = fluxMonth * cur;
    }

    document.getElementById(`${tier}_flux_day`).innerHTML = `<b>${(fluxMonth / 30).toFixed(2)} FLUX</b>/day <pareward>(${currencyFormat(fluxMonthCurrency / 30, curRadio)})</pareward><br>
    <pareward>+ <b>${((fluxMonth / 30) / paValue).toFixed(2)} FLUX Tokens/PA</b> (${currencyFormat((fluxMonthCurrency / 30) / paValue, curRadio)})</pareward>`;

    document.getElementById(`${tier}_flux_month`).innerHTML = `<b>${(fluxMonth).toFixed(2)} FLUX</b>/month <pareward>(${currencyFormat(fluxMonthCurrency, curRadio)})</pareward><br>
    <pareward>+ <b>${((fluxMonth) / paValue).toFixed(2)} FLUX Tokens/PA</b> (${currencyFormat((fluxMonthCurrency) / paValue, curRadio)})</pareward>`;

    /****************************************************
    Calculate the total monthly VPS cost
    *****************************************************/

    totalVPSCost = Number(cumVPSCost) + Number(nimVPSCost) + Number(strVPSCost);
    document.getElementById(`total_vps_cost`).innerHTML = currencyFormat(totalVPSCost, curRadio);
}


/***********************************************************************************
Calculate the total monthly profit, FLUX and required FLUX collateral if owned nodes
***********************************************************************************/

function total() {
    
    if ((cumOwnedNodes != 0 ) || (nimOwnedNodes != 0) || (strOwnedNodes != 0) || (titanMonthlyReward != 0)) {

        if (fluxCustomPrice != 0) {
            grandProfit = Number(cumMonthProfit) + Number(nimMonthProfit) + Number(strMonthProfit) + Number(titanMonthlyReward * fluxCustomPrice);
        }
        else {
            grandProfit = Number(cumMonthProfit) + Number(nimMonthProfit) + Number(strMonthProfit) + Number(titanMonthlyReward * cur);
        }

        document.getElementById("grand_profit").innerHTML = currencyFormat(grandProfit, curTemp);

        totalFluxMonth = Number(cumFluxMonth) + Number(nimFluxMonth) + Number(strFluxMonth) + titanMonthlyReward;
        document.getElementById("flux_month_total").innerHTML = totalFluxMonth.toFixed(2);

        lockedFlux = Number(document.getElementById("titan_locked_flux").value);
        requiredCollateral = cumCollateral + nimCollateral + strCollateral + lockedFlux;
        document.getElementById("required_collateral").innerHTML = requiredCollateral.toLocaleString();

        if (fluxCustomPrice != 0) {
            document.getElementById("required_collateral_cur").innerHTML = " (" + currencyFormat(requiredCollateral * fluxCustomPrice, curTemp) + ")"; 
        }
        else {
            document.getElementById("required_collateral_cur").innerHTML = " (" + currencyFormat(requiredCollateral * cur, curTemp) + ")"; 
        }
          

    } else {
        grandProfit = 0;
        document.getElementById("grand_profit").innerHTML = currencyFormat(grandProfit, curRadio);

        totalFluxMonth = 0;
        document.getElementById("flux_month_total").innerHTML = totalFluxMonth.toFixed(2);

        requiredCollateral = 0;
        document.getElementById("required_collateral").innerHTML = requiredCollateral;
        document.getElementById("required_collateral_cur").innerHTML = "";   
    }
}


/*****************************************************
Custom FLUX price input
*****************************************************/

fluxCustomPrice = document.getElementById("custom_price_input");

fluxCustomPrice.oninput = function() {
    
    fluxCustomPrice = this.value;
    fluxCustomPrice = fluxCustomPrice.replace("," , ".");

    if (isNaN(fluxCustomPrice)) {
        document.getElementById("custom_price").innerHTML = "<b>Only integer/float please</b>";
        document.getElementById("custom_price_input").value = "";
        return;
    } else {
        curRadio = document.querySelector('input[name="currencyChoice"]:checked').value;
        
        fluxCustomPrice = Number(fluxCustomPrice.replace("," , "."));

        if (cumOwnedNodes != 0 ) {
            if (fluxCustomPrice != 0) {
                calculate("cum", cum, fluxCustomPrice, curRadio, cumOwnedNodes, cumVPSCost);
            }
            else {
                calculate("cum", cum, cur, curRadio, cumOwnedNodes, cumVPSCost);
            }
        } else {
            initCumulus(curRadio);
        }
    
        if (nimOwnedNodes != 0 ) {
            if (fluxCustomPrice != 0) {
                calculate("nim", nim, fluxCustomPrice, curRadio, nimOwnedNodes, nimVPSCost);
            }
            else {
                calculate("nim", nim, cur, curRadio, nimOwnedNodes, nimVPSCost);
            }
        } else {
            initNimbus(curRadio);
        }
    
        if (strOwnedNodes != 0 ) {
            if (fluxCustomPrice != 0) {
                calculate("str", str, fluxCustomPrice, curRadio, strOwnedNodes, strVPSCost);
            }
            else {
                calculate("str", str, cur, curRadio, strOwnedNodes, strVPSCost);
            }
        } else {
            initStratus(curRadio);
        }

        lockedFlux = document.getElementById("titan_locked_flux").value;

        if (lockedFlux != 0 ) {
            titanProfitCalc();
        } else {
            return;
        }

    }
}


/************************************************
Function to get rank radio value (IP or wallet)
************************************************/

function rankRadio() {

    rankRadioValue = document.querySelector('input[name="rankChoice"]:checked').value;

    if (rankRadioValue === "IP") {
        document.getElementById("rank_instruction").innerHTML = "Enter your Flux node IP address below.<br>If multiple nodes running on the same IP, please enter only the IP address and not the port number.<br>It will list all the Flux nodes attached to this IP address with rank and next reward information.";
        document.getElementById("node_rank_input").value = "";
        document.getElementById("node_rank_input").placeholder = "xx.xx.xx.xx";
        document.querySelector("#node_rank").innerHTML = "";

    } else if (rankRadioValue === "WALLET") {
        document.getElementById("rank_instruction").innerHTML = "Enter your Flux wallet payment address below.<br>It will list all the Flux nodes attached to this wallet with rank and next reward information.";
        document.getElementById("node_rank_input").value = "";
        document.getElementById("node_rank_input").placeholder = "t1xxxxxxxxx";
        document.querySelector("#node_rank").innerHTML = "";
    }
}


/************************************************
Trigger a submit button click on Enter key
************************************************/

var inputRank = document.getElementById("node_rank_input");

inputRank.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
    document.getElementById("buttonRank").click();
    }
});


/************************************************
Function for node rank check and next reward
************************************************/

function rankSearch() {

    let urlFluxNodes = "https://explorer.runonflux.io/api/status?q=getFluxNodes";
    let nodeAddress = document.getElementById('node_rank_input').value;

    document.querySelector("#node_rank").innerHTML = "<br>Loading data from FLUX API, please wait...";

    getFluxNodes(urlFluxNodes);

    async function getFluxNodes(urlFluxNodes) {
        const response = await fetch(urlFluxNodes);
        var data = await response.json();
        if (response) {
            getRank(data);
        }
    }

    function getRank(data) {

        jsonArray = data.fluxNodes;
        var nodeCount = 0;

        /*************************************
        Query based on IP address input
        *************************************/

        if (rankRadioValue === "IP") {

            nodeAddressTemp = nodeAddress.replaceAll('.', '');

            function onlyNumbers(nodeAddressTemp) {
                return /^[0-9]+$/.test(nodeAddressTemp);
            }
            
            if (onlyNumbers(nodeAddressTemp)) {

                for (var i = 0; i < jsonArray.length; i++) {         

                    if (jsonArray[i].ip.startsWith(nodeAddress)) {
                        nodeCount++;
                    }
                }
                
                document.querySelector("#node_rank").innerHTML = "";
                document.querySelector("#node_rank").innerHTML += `<br>Node rank information for IP address: <b>${nodeAddress}</b> (<b style="color:#43B3E0;">${nodeCount}</b> active nodes)`;

                for (var i = 0; i < jsonArray.length; i++) {         

                    if (jsonArray[i].ip.startsWith(nodeAddress)) {
    
                        document.querySelector("#node_rank").innerHTML += `<br><br>Node IP: <b>${jsonArray[i].ip}</b> (${jsonArray[i].tier})`;
                        //document.querySelector("#node_rank").innerHTML += `<br>Payment address: ${jsonArray[i].payment_address}`;
                        document.querySelector("#node_rank").innerHTML += `<br>Current node rank: <b style="color:#43B3E0;">${jsonArray[i].rank}</b>`;
                
                        rank = jsonArray[i].rank * 2;
    
                        calculateRank(rank);
                    }
                }

            } else {
                document.querySelector("#node_rank").innerHTML = `<br><b>Please enter a valid IP address without port number (xx.xx.xx.xx).</b>`;
                jsonArray = [];
                return;
            }

            document.querySelector("#node_rank").innerHTML += `<br><br>Click again on "Submit" button if you want to refresh.<br><br>If you want to know more about your node (PA/tokens, fees...), please look at <a href="https://paoverview.app.runonflux.io/" target="_blank">paoverview.app.runonflux.io</a>`;
            jsonArray = [];          
        }
        
        /*************************************
        Query based on wallet address input
        *************************************/

        if (rankRadioValue === "WALLET") {

            let nodeAddress = document.getElementById('node_rank_input').value;

            if (nodeAddress.startsWith("t1")) {

                for (var i = 0; i < jsonArray.length; i++) {         

                    if (jsonArray[i].payment_address === nodeAddress) {
                        nodeCount++;
                    }
                }
    
                document.querySelector("#node_rank").innerHTML = "";
                document.querySelector("#node_rank").innerHTML += `<br>Node rank information for wallet address: <b>${nodeAddress}</b><br><b style="color:#43B3E0;">${nodeCount}</b> active nodes for this address.`;
    
                for (var i = 0; i < jsonArray.length; i++) {        
                    
                    if (jsonArray[i].payment_address === nodeAddress) {
    
                        document.querySelector("#node_rank").innerHTML += `<br><br>Node IP: <b>${jsonArray[i].ip}</b> (${jsonArray[i].tier})`;
                        document.querySelector("#node_rank").innerHTML += `<br>Current node rank: <b style="color:#43B3E0;">${jsonArray[i].rank}</b>`;
                
                        rank = jsonArray[i].rank * 2;
    
                        calculateRank(rank);
                    } 
                }

            } else {
                document.querySelector("#node_rank").innerHTML = `<br><b>Please enter a correct Flux wallet address (t1xxxxxx).</b>`;
                jsonArray = [];
                return;
            }

            document.querySelector("#node_rank").innerHTML += `<br><br>Click again on "Submit" button if you want to refresh.<br><br>If you want to know more about your node (PA/tokens, fees...), please look at <a href="https://paoverview.app.runonflux.io/?address=${nodeAddress}" target="_blank">paoverview.app.runonflux.io</a>`;
            jsonArray = []; 
        }
    }

    async function calculateRank(rank) {
        day = Math.floor(rank / 1440);
        hour = Math.floor((rank - day * 1440) / 60);
        minute = rank - (day * 1440) - (hour * 60);

        dayDisplay = day > 0 ? day + (day == 1 ? " day, " : " days, ") : "";
        hourDisplay = hour > 0 ? hour + (hour == 1 ? " hour and " : " hours and ") : "";
        minuteDisplay = minute > 0 ? minute + (minute == 1 ? " minute" : " minutes") : "";

        nextReward = dayDisplay + hourDisplay + minuteDisplay;
        document.querySelector("#node_rank").innerHTML += `<br>Next reward in: <b>${nextReward}</b>`;

        currentTime = new Date();  
        currentTime.setTime(currentTime.getTime() + (rank * 60000));

        minutes = currentTime.getMinutes();

        if (minutes < 10) {
            minutes = "0" + minutes;
        }

        hours = currentTime.getHours();

        if (hours < 10) {
            hours = "0" + hours;
        }

        document.querySelector("#node_rank").innerHTML += `<br>Next reward on: <b>${currentTime.getDate()}/${(currentTime.getMonth()+1)}/${currentTime.getFullYear()} - ${hours}:${minutes}</b>`;
    }
}

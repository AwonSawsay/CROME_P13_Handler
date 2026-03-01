/*********************************************************************
P13 ECU Features code for CROME
Auth: Awon (BiggieSmallBlock on pgmfi)
*********************************************************************
This is the supporting code for ECUFeatures.html.
This code edits the ADC results of all the RP jumpers on 
on the board allowing the user to toggle board features such as
VTEC, KNOCK , ELD, BARO, AUTO/5SPD and various other ECU 
Specific adjustments.

Note: In stock form, all the feature enable/disable information is 
actually contained in ROM. The feature realted RP Jumpers just act as an index 
for tbl_6d56, which itself is an index for tbl_6cff.  (RP 11 / 12 the 
auto / 5 speed jumper is an exception here. It's results are actually blended
in to the table lookup result from tbl_6cff) 

It's worth noting that the reason you can't move a stock ROM from a 
P13 to a P12 (for example) is because the RP jumpers will look up an 
invalid value from tbl_6d56, telling the ECU that there is a 
ROM / Hardware mismatch and throw a BRK code and stay in a reset 
loop (limp mode). The compatibility patch on the Options page actually 
just populates this table with known indices in the expected locations, 
allowing the ROM to be run on all the known (to me) ECUs that run the 
same code base.

Changelog:
    -v1.0   - Initial working release - March 2026
********************************************************************/

var ECU_FEATURES_VERSION = '1.0';

/// <reference path="./P13Addresses.js" />

var FEATURE_DEFAULTS_P13 = {
    auto_trans: "off", vtec: "on", knock: "on", eld: "on",
    baro: "on", tcs: "off", vss_cut: "off", injector_test: "on",
    at_idle_comp: "off", eld_option: "off", min_fuel_adj: "off",
    closed_loop_adj: "off", unused: "off"
};

var ADJUST_DEFAULTS_P13 = {
    rp12_fuel: 255, rp34_ign: 0, rp78_fuel: 127,
    rp910_egr: 255, rp1112_at: 0, rp1314_cl: 255
};

function onLoadFeaturesInit() {
    document.getElementsByName("topMode")[2].checked = true;
    showFeatureVersion();
    var romSettings = rpRomHandler("read");
    
    // Use ROM Settings for features?
    if (romSettings.isActive) {
        var enableBytes = [romSettings.col1EnableValue, romSettings.col2EnableValue, romSettings.col3EnableValue];
        var disableBytes = [romSettings.col1DisableValue, romSettings.col2DisableValue, romSettings.col3DisableValue];
        loadFeaturesFromBytes(enableBytes, disableBytes);
    }
    // Get ROM settings for adjustments and apply to form
    var rpAdjSettings = getRPJumperAdjValuesFromRom();
    applyTopMode(rpAdjSettings);
}

function showFeatureVersion() {
    var meta = document.getElementById("ECU_HTML_VERSION");
    document.getElementById("versionCell").innerHTML =
        "v" + meta.getAttribute("data-version");
}

function getRadio(name) {
    var r = document.getElementsByName(name);
    for (var i = 0; i < r.length; i++) if (r[i].checked) return r[i].value;
    return "";
}

function applyTopMode(adjustObj) {
    var mode = getRadio("topMode");
    var isP13 = (mode === "p13");
    var isCustom = (mode === "custom");
    var isECU = (mode === "ecu");

    // ----- FEATURE BLOCK -----
    var featureRows = document.getElementById("featureBlock")
                              .getElementsByTagName("tr");

    for (var i = 0; i < featureRows.length; i++) {
    
        var inputs = featureRows[i].getElementsByTagName("input");

        for (var j = 0; j < inputs.length; j++) {

            var input = inputs[j];
            var blockKnock = false;
            
            // Disable knock row when boost columns are being used, since the boost handler disables it.
            if (input.name === "knock" &&
                rom.byteAt(address.TABLES_USING_STANDARD_SIZE) === 0x00) {
                blockKnock = true;
                input.disabled = true;
                setSpanStyleItalic(input, true);
                
            }

            if (isCustom && !blockKnock) {

                input.disabled = false;
                setSpanStyleItalic(input, false);

            } else if (isP13 && !blockKnock) {

                if (input.value === FEATURE_DEFAULTS_P13[input.name])
                    input.checked = true;
                else
                    input.checked = false;

                input.disabled = true;
                setSpanStyleItalic(input, true);

            } else if (isECU && !blockKnock) {
                if (input.value === "ecu")
                    input.checked = true;
                else
                    input.checked = false;

                input.disabled = true;
                setSpanStyleItalic(input, true);
            }
        }
    }

    // ----- ADJUSTMENT BLOCK -----
    
    var adjustRows = document.getElementById("adjustBlock").getElementsByTagName("tr");
    for (var i = 0; i < adjustRows.length; i++) {
        var row = adjustRows[i];
        var inputs = row.getElementsByTagName("input");
        var txt = null;
        var fullKey = null;

        // find textbox + group name
        for (var k = 0; k < inputs.length; k++) {
            if (inputs[k].type === "text")
                txt = inputs[k];

            if (inputs[k].type === "radio")
                fullKey = inputs[k].name;
        }

        if (!fullKey) continue;

        var baseKey = fullKey.split("_")[0];
        if (isCustom) {
            var patched = false;
            var value = "";
        
            if (adjustObj) {
                patched = adjustObj[baseKey + "isPatched"];
                value = adjustObj[baseKey];
            }
        
            // --- Radios ---
            for (var j = 0; j < inputs.length; j++) {
                var r = inputs[j];
                if (r.type !== "radio") continue;
            
                r.disabled = false;        // always enable radios
                setSpanStyleItalic(r, false);
            
                // Only set checked if adjustObj exists
                if (adjustObj) {
                    r.checked = patched ? (r.value === "custom") : (r.value === "ecu");
                }
            }
        
            // --- Textbox ---
            if (txt) {
                txt.disabled = !adjustObj || !patched ? true : false;  // always enable/disable, but only set value if patched
                if (adjustObj && patched) {
                    txt.value = value;
                }
                // if no adjustObj, leave txt.value as-is
            }
        
        } else if (isP13) {

            for (var j = 0; j < inputs.length; j++) {

                var r = inputs[j];
                if (r.type !== "radio") continue;

                r.checked = (r.value === "default");
                r.disabled = true;
                setSpanStyleItalic(r, true);
            }

            if (txt) {
                txt.value = ADJUST_DEFAULTS_P13[fullKey];
                txt.disabled = true;
            }

        } else if (isECU) {

        for (var j = 0; j < inputs.length; j++) {

            var r = inputs[j];
            if (r.type !== "radio") continue;

            r.checked = (r.value === "ecu");
            r.disabled = true;
            setSpanStyleItalic(r, true);
        }

        if (txt) {
            txt.value = "";
            txt.disabled = true;
        }
        }
    }

}

// Utility function to set span italic for radio labels
function setSpanStyleItalic(input, italic) {
    var span = null;
    var sib = input.nextSibling;
    while (sib) {
        if (sib.nodeType === 1 && sib.tagName.toLowerCase() === "span") {
            span = sib;
            break;
        }
        sib = sib.nextSibling;
    }
    if (span) span.style.fontStyle = italic ? "italic" : "normal";
}

function applyAdjustDefaults(){
    for(var key in ADJUST_DEFAULTS_P13){
        var defRadio=document.getElementById(key+"_default");
        if(defRadio) defRadio.checked=true;
        var txt=document.getElementById(key+"_value");
        if(txt){ txt.value=ADJUST_DEFAULTS_P13[key]; txt.disabled=true; }
    }
}

function adjustmentRadioClick(rowName) {
    // Find the row by using the name of the radio buttons
    var radios = document.getElementsByName(rowName);
    var txt = null;

    // Find the text input in the same row
    for (var i = 0; i < radios.length; i++) {
        if (radios[i].type === "text") {
            txt = radios[i];
            break;
        }
    }

    // If no text input found, search nextSibling of radios
    if (!txt) {
        for (var i = 0; i < radios.length; i++) {
            var sib = radios[i].nextSibling;
            while (sib) {
                if (sib.nodeType === 1 && sib.tagName.toLowerCase() === "input" && sib.type === "text") {
                    txt = sib;
                    break;
                }
                sib = sib.nextSibling;
            }
            if (txt) break;
        }
    }

    // Enable textbox only if "custom" radio is selected
    if (radios[1].checked) {  // assume radios[1] is "custom"
        if (txt) txt.disabled = false;
    } else {
        if (txt) txt.disabled = true;

        // If "default" radio selected, repopulate text box with default value
        if (radios[0].checked) {  // assume radios[0] is "default"
            if (txt) txt.value = ADJUST_DEFAULTS_P13[rowName];
        } else {  // ECU mode
            if (txt) txt.value = "";
        }
    }
}

function numeric255(){ var k=window.event.keyCode; if(k<48||k>57) window.event.keyCode=0; }

function clamp255(el){ var v=parseInt(el.value,10); if(isNaN(v)||v<0)v=0;if(v>255)v=255; el.value=v; }

function showHelp(){ 
    var helpMsg ="This page allows you to customize what the RP jumpers report as available features on your ECU. \n\n" +
                "To get started, select a mode at the top:\n" +
                "\n- P13 Defaults: Loads the default settings for a typical US 5 Spd P13 ECU." +
                "\n- Custom: Allows you to manually configure each feature and adjustment." +
                "\n- ECU Select: Uses the physical RP jumpers to determine features available.\n\n" +
                "For features, you can choose to turn them ON, OFF, or let the ECU Select the value based on the RP Jumpers.\n\n" +
                "For adjustments, you can choose the Default value, Custom value (0-255) or let the ECU Select the value based on the RP Jumpers..\n\n" +
                "Note: Just enabling features does not mean that the ROM or ECU will support it. " +
                "As an example, if you enable TCS while using a non TCS ROM, the tables that support it may not be populated." +
                "If you enable VTEC on a non-VTEC ECU you must use alternate VTEC outputs and disable VTS and VTP since the ECU will not " +
                "have the VTEC hardware installed.\n\n" +
                "Tuning Notes: If ECU select is chosen , you can expect the same tune to perform differently on 2 different ECUs " +
                "with different jumper settings. A P11, P12, P13, P14, P39, P51 etc should behave identically on the same tune if static " +
                "values are chosen.\n" +
                "\nRP 11/12 Jumpers have been omitted from this page because their results are blended in with the features. " + 
                "The features are a result of RP 15 - 18 being used as a lookup index for tbl_5d56 which contains an index for tbl_6cff. " + 
                "tbl_6cff tells the ROM what features are available on the ECU.";
    alert(helpMsg); 
}

function closeWindow(){ window.close(); }

// Get states from form and return as settings object
function collectFormSettings() {
    var settings = {};

    // --- FEATURE ROWS ---
    var featureRows = document.getElementById("featureBlock").getElementsByTagName("tr");
    for (var i = 0; i < featureRows.length; i++) {
        var row = featureRows[i];
        var inputs = row.getElementsByTagName("input");
        for (var j = 0; j < inputs.length; j++) {
            var r = inputs[j];
            if (r.type === "radio" && r.checked) {
                // Map to 0 = off, 1 = on, 2 = ECU Select
                if (r.value === "on") settings[r.name] = 1;
                else if (r.value === "off") settings[r.name] = 0;
                else if (r.value === "ecu") settings[r.name] = 2;
                break; // only one radio per group
            }
        }
    }

    // --- ADJUSTMENT ROWS ---
    var adjustRows = document.getElementById("adjustBlock").getElementsByTagName("tr");
    for (var i = 0; i < adjustRows.length; i++) {
        var row = adjustRows[i];
        var radios = row.getElementsByTagName("input");
        var txt = null;

        // Find text input in the row
        for (var k = 0; k < radios.length; k++) {
            if (radios[k].type === "text") {
                txt = radios[k];
                break;
            }
        }

        // Determine selected radio
        for (var j = 0; j < radios.length; j++) {
            var r = radios[j];
            if (r.type === "radio" && r.checked) {
                var key = r.name;
                if (r.value === "custom" && txt) {
                    settings[key] = parseInt(txt.value, 10) || 0; // use textbox value
                } else if (r.value === "default") {
                    settings[key] = ADJUST_DEFAULTS_P13[key]; // numeric default
                } else if (r.value === "ecu") {
                    settings[key] = 2; // ECU select
                }
                break;
            }
        }
    }

    return settings;
}


// Create the 3 enable and 3 disable bytes based on settings
function generateFeatureBytes(settings) {
    // Feature-to-byte-bit mapping ---
    var featureMap = {
        "vss_cut": {byte: 0, bit: 0},
        "unused": {byte: 0, bit: 1},
        "injector_test": {byte: 0, bit: 2},
        "closed_loop_adj": {byte: 0, bit: 3},
        "min_fuel_adj": {byte: 0, bit: 5},

        "auto_trans": {byte: 1, bit: 0},
        "eld": {byte: 1, bit: 2},
        "baro": {byte: 1, bit: 3},
        "tcs": {byte: 1, bit: 4},
        "at_idle_comp": {byte: 1, bit: 6},

        "vtec": {byte: 2, bit: 0},
        "knock": {byte: 2, bit: 1},
        "eld_option": {byte: 2, bit: 2}
    };

    // --- Initialize enable and disable bytes ---
    var enableBytes = [0, 0, 0];  // 3 bytes
    var disableBytes = [0, 0, 0]; // 3 bytes

    // --- Loop through all features ---
    for (var feature in featureMap) {
        if (!featureMap.hasOwnProperty(feature)) continue;
        var map = featureMap[feature];
        var byteIndex = map.byte;
        var bitIndex = map.bit;

        var val = settings[feature]; // 0 = off, 1 = on, 2 = ECU Select

        if (val === 1) {
            // ON: enable bit = 1, disable bit = 1
            enableBytes[byteIndex] |= (1 << bitIndex);
            disableBytes[byteIndex] |= (1 << bitIndex);
        } else if (val === 0) {
            // OFF: enable bit = 0, disable bit = 0
            enableBytes[byteIndex] &= ~(1 << bitIndex);
            disableBytes[byteIndex] &= ~(1 << bitIndex);
        } else if (val === 2) {
            // ECU Select: enable bit = 0, disable bit = 1
            enableBytes[byteIndex] &= ~(1 << bitIndex);
            disableBytes[byteIndex] |= (1 << bitIndex);
        }
    }

    // --- Return the 6 bytes ---
    return {
        enableBytes: enableBytes,
        disableBytes: disableBytes
    };
}

// Example to load settings from ROM bytes
function loadFeaturesFromBytes(enableBytes, disableBytes) {
    // Feature-to-byte-bit mapping ---
    var featureMap = {
        "vss_cut": {byte: 0, bit: 0},
        "unused": {byte: 0, bit: 1},
        "injector_test": {byte: 0, bit: 2},
        "closed_loop_adj": {byte: 0, bit: 3},
        "min_fuel_adj": {byte: 0, bit: 5},

        "auto_trans": {byte: 1, bit: 0},
        "eld": {byte: 1, bit: 2},
        "baro": {byte: 1, bit: 3},
        "tcs": {byte: 1, bit: 4},
        "at_idle_comp": {byte: 1, bit: 6},

        "vtec": {byte: 2, bit: 0},
        "knock": {byte: 2, bit: 1},
        "eld_option": {byte: 2, bit: 2}
    };
    var usingCustom = false;

    for (var feature in featureMap) {
        if (!featureMap.hasOwnProperty(feature)) continue;
        var map = featureMap[feature];
        var byteIndex = map.byte;
        var bitIndex = map.bit;

        // Determine the bit state
        var enBit = (enableBytes[byteIndex] >> bitIndex) & 1;
        var disBit = (disableBytes[byteIndex] >> bitIndex) & 1;

        var featureVal;
        if (enBit === 1 && disBit === 1) featureVal = 1; // ON
        else if (enBit === 0 && disBit === 0) featureVal = 0; // OFF
        else if (enBit === 0 && disBit === 1) featureVal = 2; // ECU Select
        else featureVal = 2; // Default to ECU Select if invalid

        // Set the corresponding radio
        var radios = document.getElementsByName(feature);
        
        for (var i = 0; i < radios.length; i++) {
            var r = radios[i];
            if (r.type === "radio") {
                if (featureVal === 0 && r.value === "off"){
                    r.checked = true;
                    usingCustom = true;
                }
                else if (featureVal === 1 && r.value === "on") {
                    r.checked = true;
                    usingCustom = true;
                }
                else if (featureVal === 2 && r.value === "ecu") r.checked = true;
            }
        }
    }

    // --- Set top mode to Custom ---
    if(usingCustom){
        var modeRadio = document.getElementsByName("topMode");
        for (var i = 0; i < modeRadio.length; i++) {
            if (modeRadio[i].value === "custom") modeRadio[i].checked = true;
        }
    }
    // Apply row enable/disable logic
    applyTopMode();
}

/** Adds or remove the patch code and hooks to force RP jumper results from tbl_6cff
 * @param mode read / add / remove
*/
function rpRomHandler(mode) {
    // Adds / Removes code that allows the user to control RP jumper settings
    // Returns the address for enable / disable bit masks and value
    // Modes:
    // read = returns col enable /disable byte addresses and values
    // write = adds code to rom if not already present
    // remove = remove code from ROM if present and unused
    // Call this function to add the code, then write whatever bits you want to enable or disable
    // to the enable / disable bit masks.
    
    var isActive = false; // set to true if the patch code is already present in ROM
    if (rom.byteAt(address.RP_FORCE_JMPR_FUNC_LOC_MAIN) != 0xff) {
        isActive = true;
    }
    
    // Hooks
    var RP_FORCE_JMPR_HOOK_LOC_COL1 = 0x1012;
    var RP_FORCE_JMPR_HOOK1_STOCK_CODE = [0x88, 0x99, 0xd0];     // STB A, r0; MOVB r1, #0d0h
    var RP_FORCE_JMPR_HOOK_LOC_COL2 = 0xff9;
    var RP_FORCE_JMPR_HOOK2_STOCK_CODE = [0x88, 0x99, 0xa2];     // STB A, r0; MOVB r1, #0a2h
    var RP_FORCE_JMPR_HOOK_LOC_COL3 = 0x102b;
    var RP_FORCE_JMPR_HOOK3_STOCK_CODE = [0x88, 0x99, 0xf8];     // STB A, r0; MOVB r1, #0f8h
    
    /**Patch Code for column 1:			
	MOVB 	r1, #0d0h			; Bit mask to reset all ECU options from Col 1 register
	ANDB 	A, #0ffh			; Use this bit mask to disable any features
	ORB 	A, #000h 			; Use this bit mask to force enable any features
	STB 	A, r0				; This is the active option bit mask 
	RT	 
    */
   
    // Custom Patch code 
    var RP_FORCE_JMPR_PATCH_CODE_COL1 = [0x99, 0xD0, 0xD6, 0x2F, 0xE6, 0x00, 0x88, 0x01];
    var RP_FORCE_JMPR_PATCH_CODE_COL2 = [0x99, 0xA2, 0xD6, 0x5d, 0xE6, 0x00, 0x88, 0x01];
    var RP_FORCE_JMPR_PATCH_CODE_COL3 = [0x99, 0xF8, 0xD6, 0x07, 0xE6, 0x00, 0x88, 0x01];
    
    // Custom Patch code addresses
    var RP_FORCE_JMPR_FUNC_LOC_COL1 = address.RP_FORCE_JMPR_FUNC_LOC_MAIN;
    var RP_FORCE_JMPR_FUNC_LOC_COL2 = RP_FORCE_JMPR_FUNC_LOC_COL1 + RP_FORCE_JMPR_PATCH_CODE_COL1.length;
    var RP_FORCE_JMPR_FUNC_LOC_COL3 = RP_FORCE_JMPR_FUNC_LOC_COL2 + RP_FORCE_JMPR_PATCH_CODE_COL2.length;
    
    // Location of bit mask used to enable features for each column
    var RP_FORCE_JMPR_COL1_ENABLE_BYTE_LOC = RP_FORCE_JMPR_FUNC_LOC_COL1 + 5;
    var RP_FORCE_JMPR_COL2_ENABLE_BYTE_LOC = RP_FORCE_JMPR_FUNC_LOC_COL2 + 5;
    var RP_FORCE_JMPR_COL3_ENABLE_BYTE_LOC = RP_FORCE_JMPR_FUNC_LOC_COL3 + 5;
    
    // Location of bit mask used to disable features for each column
    var RP_FORCE_JMPR_COL1_DISABLE_BYTE_LOC = RP_FORCE_JMPR_FUNC_LOC_COL1 + 3;
    var RP_FORCE_JMPR_COL2_DISABLE_BYTE_LOC = RP_FORCE_JMPR_FUNC_LOC_COL2 + 3;
    var RP_FORCE_JMPR_COL3_DISABLE_BYTE_LOC = RP_FORCE_JMPR_FUNC_LOC_COL3 + 3;

    // add patch code and hooks to ROM if it's not already installed
    if (mode == "add") {
        // has RP jumper handling code been added?
        if (!isActive) {
            // Write patch code 
            P13.rom_write(RP_FORCE_JMPR_FUNC_LOC_COL1, RP_FORCE_JMPR_PATCH_CODE_COL1, RP_FORCE_JMPR_PATCH_CODE_COL1.length);
            P13.rom_write(RP_FORCE_JMPR_FUNC_LOC_COL2, RP_FORCE_JMPR_PATCH_CODE_COL2, RP_FORCE_JMPR_PATCH_CODE_COL2.length);
            P13.rom_write(RP_FORCE_JMPR_FUNC_LOC_COL3, RP_FORCE_JMPR_PATCH_CODE_COL3, RP_FORCE_JMPR_PATCH_CODE_COL3.length);

            // Hook col 1 checks
            rom.byteAt(RP_FORCE_JMPR_HOOK_LOC_COL1) = 0x32; // CAL
            rom.wordAt(RP_FORCE_JMPR_HOOK_LOC_COL1 + 1) = RP_FORCE_JMPR_FUNC_LOC_COL1;

            // Hook col 2 checks
            rom.byteAt(RP_FORCE_JMPR_HOOK_LOC_COL2) = 0x32; // CAL
            rom.wordAt(RP_FORCE_JMPR_HOOK_LOC_COL2 + 1) = RP_FORCE_JMPR_FUNC_LOC_COL2;

            // Hook col 3 checks
            rom.byteAt(RP_FORCE_JMPR_HOOK_LOC_COL3) = 0x32; // CAL
            rom.wordAt(RP_FORCE_JMPR_HOOK_LOC_COL3 + 1) = RP_FORCE_JMPR_FUNC_LOC_COL3;

            isActive = true;
        }
    }

    // remove patch code and hooks from ROM if it's present
    if (mode == "remove") {
        if (isActive)
        {

            // blank the patch code area
            var RPForcePatchCodeSize = RP_FORCE_JMPR_PATCH_CODE_COL1.length + RP_FORCE_JMPR_PATCH_CODE_COL2.length + RP_FORCE_JMPR_PATCH_CODE_COL3.length;
            P13.rom_fill(address.RP_FORCE_JMPR_FUNC_LOC_MAIN, address.RP_FORCE_JMPR_FUNC_LOC_MAIN + RPForcePatchCodeSize - 1, 0xff);

            // restore the stock code
            P13.rom_write(RP_FORCE_JMPR_HOOK_LOC_COL1, RP_FORCE_JMPR_HOOK1_STOCK_CODE, RP_FORCE_JMPR_HOOK1_STOCK_CODE.length);
            P13.rom_write(RP_FORCE_JMPR_HOOK_LOC_COL2, RP_FORCE_JMPR_HOOK2_STOCK_CODE, RP_FORCE_JMPR_HOOK2_STOCK_CODE.length);
            P13.rom_write(RP_FORCE_JMPR_HOOK_LOC_COL3, RP_FORCE_JMPR_HOOK3_STOCK_CODE, RP_FORCE_JMPR_HOOK3_STOCK_CODE.length);
        }
    }
    
    // Return bitmask locations and values for each column
    return{
        isActive: isActive,
        
        col1EnableLoc: RP_FORCE_JMPR_COL1_ENABLE_BYTE_LOC,
        col1EnableValue: rom.byteAt(RP_FORCE_JMPR_COL1_ENABLE_BYTE_LOC),
        
        col1DisableLoc: RP_FORCE_JMPR_COL1_DISABLE_BYTE_LOC,
        col1DisableValue: rom.byteAt(RP_FORCE_JMPR_COL1_DISABLE_BYTE_LOC),
        
        col2EnableLoc: RP_FORCE_JMPR_COL2_ENABLE_BYTE_LOC,
        col2EnableValue: rom.byteAt(RP_FORCE_JMPR_COL2_ENABLE_BYTE_LOC),
        
        col2DisableLoc: RP_FORCE_JMPR_COL2_DISABLE_BYTE_LOC,
        col2DisableValue: rom.byteAt(RP_FORCE_JMPR_COL2_DISABLE_BYTE_LOC),
        
        col3EnableLoc: RP_FORCE_JMPR_COL3_ENABLE_BYTE_LOC,
        col3EnableValue: rom.byteAt(RP_FORCE_JMPR_COL3_ENABLE_BYTE_LOC),
        
        col3DisableLoc: RP_FORCE_JMPR_COL3_DISABLE_BYTE_LOC,
        col3DisableValue: rom.byteAt(RP_FORCE_JMPR_COL3_DISABLE_BYTE_LOC)

    };
}



/** Handler for RP 1 2 Jumper settings
 * @param mode "read" to just read the current value, "stock" to write stock code for ECU select, "custom" to write patch code with specified value
 * @param value value to write for custom mode, will be constrained to 0-255
 * */
function rp12Handler(mode, value){
    if (typeof value !== "number") {
        value = 0;
    }
    var STOCK_CODE = [0x62, 0xd4, 0x03, 0xf2];
    var PATCH_CODE = [0x77, P13.constrainByte(value), 0x00, 0x00];
    var PATCH_ADDRESS = address.RP_1_2_OVERRIDE_LOC;
    var PATCH_VALUE_LOC = PATCH_ADDRESS + 1; 
    var romValue = null;
    var isPatched = false;
    
    // Write patch code to ROM 
    switch(mode){
        case "custom":
            P13.rom_write(PATCH_ADDRESS, PATCH_CODE, PATCH_CODE.length);
            break;
        case "stock":
            P13.rom_write(PATCH_ADDRESS, STOCK_CODE, STOCK_CODE.length);
            break;
        case "read":
            break;
    }
    
    if(rom.byteAt(PATCH_ADDRESS) === PATCH_CODE[0]) {
        isPatched = true;
        romValue = rom.byteAt(PATCH_VALUE_LOC);
    }
    
    return {
        isPatched: isPatched,
        romValue: romValue
    };
}

/** Handler for RP 3 4 Jumper settings
 * @param mode "read" to just read the current value, "stock" to write stock code for ECU select, "custom" to write patch code with specified value
 * @param value value to write for custom mode, will be constrained to 0-255
 * */
function rp34Handler(mode, value){
    if (typeof value !== "number") {
        value = 0;
    }
    var STOCK_CODE = [0x62, 0xdc, 0x03, 0xf2];
    var PATCH_CODE = [0x77, P13.constrainByte(value), 0x00, 0x00];
    var PATCH_ADDRESS = address.RP_3_4_OVERRIDE_LOC;
    var PATCH_VALUE_LOC = PATCH_ADDRESS + 1; 
    var romValue = null;
    var isPatched = false;
    
    // Write patch code to ROM 
    switch(mode){
        case "custom":
            P13.rom_write(PATCH_ADDRESS, PATCH_CODE, PATCH_CODE.length);
            break;
        case "stock":
            P13.rom_write(PATCH_ADDRESS, STOCK_CODE, STOCK_CODE.length);
            break;
        case "read":
            break;
    }
    
    if(rom.byteAt(PATCH_ADDRESS) === PATCH_CODE[0]) {
        isPatched = true;
        romValue = rom.byteAt(PATCH_VALUE_LOC);
    }
    return {
        isPatched: isPatched,
        romValue: romValue
    };
}

/** Handler for RP 7 8 Jumper settings
 * @param mode "read" to just read the current value, "stock" to write stock code for ECU select, "custom" to write patch code with specified value
 * @param value value to write for custom mode, will be constrained to 0-255
 * */
function rp78Handler(mode, value){
    if (typeof value !== "number") {
        value = 0;
    }
    var STOCK_CODE = [0x62, 0xde, 0x03, 0xf2];
    var PATCH_CODE = [0x77, P13.constrainByte(value), 0x00, 0x00];
    var PATCH_ADDRESS = address.RP_7_8_OVERRIDE_LOC;
    var PATCH_VALUE_LOC = PATCH_ADDRESS + 1; 
    var romValue = null;
    var isPatched = false;
    
    // Write patch code to ROM 
    switch(mode){
        case "custom":
            P13.rom_write(PATCH_ADDRESS, PATCH_CODE, PATCH_CODE.length);
            break;
        case "stock":
            P13.rom_write(PATCH_ADDRESS, STOCK_CODE, STOCK_CODE.length);
            break;
        case "read":
            break;
    }
    
    if(rom.byteAt(PATCH_ADDRESS) === PATCH_CODE[0]) {
        isPatched = true;
        romValue = rom.byteAt(PATCH_VALUE_LOC);
    }
    return {
        isPatched: isPatched,
        romValue: romValue
    };
}

/** Handler for RP 9 10 Jumper settings
 * @param mode "read" to just read the current value, "stock" to write stock code for ECU select, "custom" to write patch code with specified value
 * @param value value to write for custom mode, will be constrained to 0-255
 * */
function rp910Handler(mode, value){
    if (typeof value !== "number") {
        value = 0;
    }
    var STOCK_CODE = [0x62, 0xd6, 0x03, 0xf2];
    var PATCH_CODE = [0x77, P13.constrainByte(value), 0x00, 0x00];
    var PATCH_ADDRESS = address.RP_9_10_OVERRIDE_LOC;
    var PATCH_VALUE_LOC = PATCH_ADDRESS + 1; 
    var romValue = null;
    var isPatched = false;
    
    // Write patch code to ROM 
    switch(mode){
        case "custom":
            P13.rom_write(PATCH_ADDRESS, PATCH_CODE, PATCH_CODE.length);
            break;
        case "stock":
            P13.rom_write(PATCH_ADDRESS, STOCK_CODE, STOCK_CODE.length);
            break;
        case "read":
            break;
    }
    
    if(rom.byteAt(PATCH_ADDRESS) === PATCH_CODE[0]) {
        isPatched = true;
        romValue = rom.byteAt(PATCH_VALUE_LOC);
    }
    return {
        isPatched: isPatched,
        romValue: romValue
    };
}

/** Unused Handler for RP 11 12 Jumper settings
 * This jumper becomes pointless when patching feature columns directly.
 * It only controls AT or 5spd, and 1 other option that gets combined with 
 * the columns from tbl_6cff
 * @param mode "read" to just read the current value, "stock" to write stock code for ECU select, "custom" to write patch code with specified value
 * @param value value to write for custom mode, will be constrained to 0-255
 * */
function rp1112Handler(mode, value){
    if (typeof value !== "number") {
        value = 0;
    }
    var STOCK_CODE = [0x62, 0xd5, 0x03, 0xf2];
    var PATCH_CODE = [0x77, P13.constrainByte(value), 0x00, 0x00];
    var PATCH_ADDRESS = address.RP_11_12_OVERRIDE_LOC;
    var PATCH_VALUE_LOC = PATCH_ADDRESS + 1; 
    var romValue = null;
    var isPatched = false;
    
    // Write patch code to ROM 
    switch(mode){
        case "custom":
            P13.rom_write(PATCH_ADDRESS, PATCH_CODE, PATCH_CODE.length);
            break;
        case "stock":
            P13.rom_write(PATCH_ADDRESS, STOCK_CODE, STOCK_CODE.length);
            break;
        case "read":
            break;
    }
    
    if(rom.byteAt(PATCH_ADDRESS) === PATCH_CODE[0]) {
        isPatched = true;
        romValue = rom.byteAt(PATCH_VALUE_LOC);
    }
    return {
        isPatched: isPatched,
        romValue: romValue
    };
}

/** Handler for RP 13 14 Jumper settings
 * @param mode "read" to just read the current value, "stock" to write stock code for ECU select, "custom" to write patch code with specified value
 * @param value value to write for custom mode, will be constrained to 0-255
 * */
function rp1314Handler(mode, value){
    if (typeof value !== "number") {
        value = 0;
    }
    var STOCK_CODE = [0xca, 0x02, 0x77, 0x76];
    var PATCH_CODE = [0x00, 0x00, 0x77, P13.constrainByte(value)];
    var PATCH_ADDRESS = address.RP_13_14_OVERRIDE_LOC;
    var PATCH_VALUE_LOC = PATCH_ADDRESS + 3; 
    var romValue = null;
    var isPatched = false;
    
    // Write patch code to ROM 
    switch(mode){
        case "custom":
            P13.rom_write(PATCH_ADDRESS, PATCH_CODE, PATCH_CODE.length);
            break;
        case "stock":
            P13.rom_write(PATCH_ADDRESS, STOCK_CODE, STOCK_CODE.length);
            break;
        case "read":
            break;
    }
    
    if(rom.byteAt(PATCH_ADDRESS) === PATCH_CODE[0]) {
        isPatched = true;
        romValue = rom.byteAt(PATCH_VALUE_LOC);
    }
    return {
        isPatched: isPatched,
        romValue: romValue
    };
}

/** get all RP adjustment values 
 * returns object with values and patched state
*/
function getRPJumperAdjValuesFromRom(){
    var rp12isPatched = rp12Handler("read").isPatched;
    var rp34isPatched = rp34Handler("read").isPatched;
    var rp78isPatched = rp78Handler("read").isPatched;
    var rp910isPatched = rp910Handler("read").isPatched;
    var rp1314isPatched = rp1314Handler("read").isPatched;

    // Set topmode to custom if any are patched
    if(rp12isPatched || rp34isPatched || rp78isPatched || rp910isPatched || rp1314isPatched){
        var modeRadio = document.getElementsByName("topMode");
        for (var i = 0; i < modeRadio.length; i++) {
            if (modeRadio[i].value === "custom") modeRadio[i].checked = true;
        }
    }

    return {
        rp12: rp12Handler("read").romValue,
        rp12isPatched: rp12isPatched,
        
        rp34: rp34Handler("read").romValue,
        rp34isPatched: rp34isPatched,
        
        rp78: rp78Handler("read").romValue,
        rp78isPatched: rp78isPatched,
        
        rp910: rp910Handler("read").romValue,
        rp910isPatched: rp910isPatched,
        
        rp1314: rp1314Handler("read").romValue,
        rp1314isPatched: rp1314isPatched
    };
}

// Use form values to set the RP jumper adjustment values in ROM
function setRPJumperAdjValuesInRomFromForm() {

    var rows = document.getElementById("adjustBlock")
                       .getElementsByTagName("tr");

    for (var i = 0; i < rows.length; i++) {

        var inputs = rows[i].getElementsByTagName("input");
        var rowName = null;
        var selectedMode = null;

        for (var j = 0; j < inputs.length; j++) {

            if (inputs[j].type === "radio") {

                rowName = inputs[j].name;   // e.g. rp12_fuel

                if (inputs[j].checked) {
                    selectedMode = inputs[j].value;
                }
            }
        }

        if (!rowName || !selectedMode) continue;

        // Extract base key before underscore
        var baseKey = rowName.split("_")[0];  // rp12

        var handler = window[baseKey + "Handler"];
        if (typeof handler !== "function") continue;

        if (selectedMode === "ecu") {

            handler("stock");

        } else {  // default OR custom

            var txt = document.getElementById(rowName + "_value");
            var val = 0;

            if (txt) {
                val = parseInt(txt.value, 10);
                if (isNaN(val)) val = 0;
            }

            handler("custom", val);
        }
    }
}

// Update ROM values with for values
function updateROM() {
    
    // Remove custom rom code if all features are set to ECU select and boost is not disabling knock
    if(getRadio("topMode") === "ecu" && rom.byteAt(address.TABLES_USING_STANDARD_SIZE) !== 0x00){
        rpRomHandler("remove");
        setRPJumperAdjValuesInRomFromForm();
        return;
    }
    var settings = collectFormSettings();
    var featureBytes = generateFeatureBytes(settings);
    var romHandler = rpRomHandler("add"); // ensure patch code is added

    // Write enable and disable bytes to ROM
    rom.byteAt(romHandler.col1EnableLoc)  = featureBytes.enableBytes[0];
    rom.byteAt(romHandler.col1DisableLoc) = featureBytes.disableBytes[0];
    rom.byteAt(romHandler.col2EnableLoc)  = featureBytes.enableBytes[1];
    rom.byteAt(romHandler.col2DisableLoc) = featureBytes.disableBytes[1];
    rom.byteAt(romHandler.col3EnableLoc)  = featureBytes.enableBytes[2];
    rom.byteAt(romHandler.col3DisableLoc) = featureBytes.disableBytes[2];

    setRPJumperAdjValuesInRomFromForm();
}


// OK Button press handler
function onOK() {
    updateROM();
    closeWindow();
}

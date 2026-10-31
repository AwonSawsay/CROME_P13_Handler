/*********************************************************************
P13 'Options Page' code for CROME
Auth: Awon (BiggieSmallBlock on pgmfi)
*********************************************************************
This is the supporting code for OptionsPage.html.

Changelog:
    -v2.0   - Initial updated release - March 2026
********************************************************************/

var P13_OPTIONS_VERSION = '2.0';

/// <reference path="./P13Helper.js" />
/// <reference path="./P13Addresses.js" />

// ************* Main Functions *****************************

/** Get default values from ROM  */
function loadDefaults() {


    Optionfrm.txtHiRevCut.value     = P13.rpm_wordToRPM(rom.wordAt(address.REV_CUT1_LOC));
    Optionfrm.txtHiRevRes.value     = P13.rpm_wordToRPM(rom.wordAt(address.REV_RES1_LOC));
    Optionfrm.txtLoRevCut.value     = P13.rpm_wordToRPM(rom.wordAt(address.REV_CUT2_LOC));
    Optionfrm.txtLoRevRes.value     = P13.rpm_wordToRPM(rom.wordAt(address.REV_RES2_LOC));
    Optionfrm.txtUnknwnRevCut.value = P13.rpm_wordToRPM(rom.wordAt(address.REV_CUT3_LOC));
    Optionfrm.txtUnknwnRevRes.value = P13.rpm_wordToRPM(rom.wordAt(address.REV_RES3_LOC));
    Optionfrm.txtTargetIdle1.value  = P13.rpm_wordToRPM(rom.wordAt(address.TARGET_IDLE_1_LOC));
    Optionfrm.txtTargetIdle2.value  = P13.rpm_wordToRPM(rom.wordAt(address.TARGET_IDLE_2_LOC));
    Optionfrm.txtHiVtecOn.value     = P13.rpm_byteToRPM(rom.byteAt(address.HI_VTEC_ON_LOC));
    Optionfrm.txtHiVtecOff.value    = P13.rpm_byteToRPM(rom.byteAt(address.HI_VTEC_OFF_LOC));
    Optionfrm.txtLoVtecOn.value     = P13.rpm_byteToRPM(rom.byteAt(address.LO_VTEC_ON_LOC));
    Optionfrm.txtLoVtecOff.value    = P13.rpm_byteToRPM(rom.byteAt(address.LO_VTEC_OFF_LOC));
    Optionfrm.txtIABOn.value        = P13.rpm_byteToRPM(rom.byteAt(address.IAB_ON_LOC));
    Optionfrm.txtIABOff.value       = P13.rpm_byteToRPM(rom.byteAt(address.IAB_OFF_LOC));
    Optionfrm.txtICSOn.value        = P13.rpm_byteToRPM(rom.byteAt(address.ICS_ON_LOC));
    Optionfrm.txtICSOff.value       = P13.rpm_byteToRPM(rom.byteAt(address.ICS_OFF_LOC));

    // Checksum disable and ECU compatibility are applied when the ROM is opened
    // (P13.applyDefaultPatchesOnOpen), so the page only shows their state.

    // Initialize all check boxes
    callHandlers();
}

/**Check box handler */
function optionSelect(m) {
    var updateROM = true;
    switch (m) {
        // Speed Limiter
        case 0:
            handle_speedLimit(updateROM);
            break;

        case 1:
            break;

        case 2:
            break;

        // EGR
        case 3:
            handle_EGR(updateROM);
            break;

        // O2 Sensor
        case 6:
            handle_o2Sensor(updateROM);
            break;

        // O2 Heater
        case 7:
            handle_o2Heater(updateROM);
            break;

        // VTEC Speed Check
        case 8:
            handle_VTECSpeedCheck(updateROM);
            break;
        // VTEC Temp Check
        case 9:
            handle_VTECTempCheck(updateROM);
            break;

        // VTEC Pressure Check
        case 10:
            handle_VTECPressureCheck(updateROM);
            break;

        // VTEC Feedback
        case 11:
            handle_VTECFeedback(updateROM);
            break;

        // ROM Checksum
        case 13:
            handle_checksumAndRunaway(updateROM);
            break;

        // IACV
        case 14:
            handle_IACV(updateROM);
            break;

        // Unused
        case 15:
            break;

        // VSS 
        case 16:
            handle_VSS(updateROM);
            break;

        // Unused
        case 17:
        case 18:
        case 19:
            break;

        // ECU Compatibility
        case 20:
            handle_ECUCompatibility(updateROM);
            break;

        // VTEC Jumper
        case 22:
            //handle_VTECJumper(updateROM);
            break;

        // Unused
        case 23:
            break;

        // VTEC CEL Light
        case 24:
            handle_VTECcelLightIndicator(updateROM);
            break;

        // VTEC Alternate Output
        case 25:
            handle_VTECalternateOutput(updateROM);
            break;

        // VTEC - IAB out
        case 26:
            handle_VTEC_IABOut(updateROM);
            break;

        // VTEC - ICS out
        case 27:
            handle_VTEC_ICSOut(updateROM);
            break;

        // VTEC - A10 Out
        case 28:
            handle_VTEC_A10Out(updateROM);
            break;

        // VTEC - Purge out
        case 29:
            handle_VTEC_PurgeOut(updateROM);
            break;

        // Ignition Cut
        case 30:
            handle_IgnitionCut(updateROM);
            break;

        // Fuel Multiplier
        case 31:
            handle_FuelMultiplier(updateROM);
            break;

        // Use fuel table for low load
        case 32:
            handle_forceFuelTable(updateROM);
            break;
        
        // Disable most fuel adjustments
        case 33:
            handle_disableFuelComps(updateROM);
            break;        
        case 34:
            handle_largerFuelRange(updateROM);
            break;
      
        default:
            break;
    }


}

/** Update ROM with all RPM values from the option check boxes */
function Apply() {
    rom.gup();                              // begin group undo
    rom.wordAt(address.REV_CUT1_LOC)        = P13.rpm_RPMToWord(Optionfrm.txtHiRevCut.value);
    rom.wordAt(address.REV_RES1_LOC)        = P13.rpm_RPMToWord(Optionfrm.txtHiRevRes.value);
    rom.wordAt(address.REV_CUT3_LOC)        = P13.rpm_RPMToWord(Optionfrm.txtUnknwnRevCut.value);
    rom.wordAt(address.REV_RES3_LOC)        = P13.rpm_RPMToWord(Optionfrm.txtUnknwnRevRes.value);
    rom.wordAt(address.REV_CUT2_LOC)        = P13.rpm_RPMToWord(Optionfrm.txtLoRevCut.value);
    rom.wordAt(address.REV_RES2_LOC)        = P13.rpm_RPMToWord(Optionfrm.txtLoRevRes.value);
    rom.wordAt(address.TARGET_IDLE_1_LOC)   = P13.rpm_RPMToWord(Optionfrm.txtTargetIdle1.value);
    rom.wordAt(address.TARGET_IDLE_2_LOC)   = P13.rpm_RPMToWord(Optionfrm.txtTargetIdle2.value);
    rom.byteAt(address.HI_VTEC_ON_LOC)      = P13.rpm_RPMToByte(Optionfrm.txtHiVtecOn.value);
    rom.byteAt(address.HI_VTEC_OFF_LOC)     = P13.rpm_RPMToByte(Optionfrm.txtHiVtecOff.value);
    rom.byteAt(address.LO_VTEC_ON_LOC)      = P13.rpm_RPMToByte(Optionfrm.txtLoVtecOn.value);
    rom.byteAt(address.LO_VTEC_OFF_LOC)     = P13.rpm_RPMToByte(Optionfrm.txtLoVtecOff.value);
    rom.byteAt(address.IAB_ON_LOC)          = P13.rpm_RPMToByte(Optionfrm.txtIABOn.value);
    rom.byteAt(address.IAB_OFF_LOC)         = P13.rpm_RPMToByte(Optionfrm.txtIABOff.value);
    rom.byteAt(address.ICS_ON_LOC)          = P13.rpm_RPMToByte(Optionfrm.txtICSOn.value);
    rom.byteAt(address.ICS_OFF_LOC)         = P13.rpm_RPMToByte(Optionfrm.txtICSOff.value);    
    setRomVersion();                        // Write version info into ROM
    rom.gup();                              // end group undo
    window.close();
}

// ********* External Windows *******************************
function StartIdle1() {
    window.external.showBrowser('handlers\\P13_Options\\Idle1.html', 150, 270, resizable=true);
}
function StartIdle2() {
    window.external.showBrowser('handlers\\P13_Options\\Idle2.html', 150, 270, resizable=true);
}
function StartFuelXplierPage() {
    window.external.showBrowser('handlers\\P13_Options\\FuelXpliers.html', 270, 750, resizable=true);
}
function StartTableEditorPage() {
    window.external.showBrowser('handlers\\P13_Options\\TableEditor.html', 1450, 510, resizable=true);
}
function StartCustomMapPage() {
    window.external.showBrowser('handlers\\P13_Options\\CustomMap.html', 300, 135, resizable=true);
}
function StartECUfeaturesPage() {
    window.external.showBrowser('handlers\\P13_Options\\ECUFeatures.html', 450, 725, resizable=true);
}
// *********** Helper Functions *****************************
// Writes handler release version info into ROM
function setRomVersion(){
    // Get Handler release version, convert from "xx.xx" string to int[2]
    var releaseVersion = [parseInt(P13_RELEASE_VERSION.split('.')[0],10), parseInt(P13_RELEASE_VERSION.split('.')[1],10)];
    
    // If this is the first version upgrade, store previous version in ROM
    if(rom.wordAt(address.HANDLER_RELEASE_VERSION_LOC) !== 0xffff &&            // Version has been written before
    rom.wordAt(address.HANDLER_RELEASE_PREV_VERSION_LOC) === 0xffff &&          // Version has not been upgraded yet
    (rom.byteAt(address.HANDLER_RELEASE_VERSION_LOC) +                          
    (rom.byteAt(address.HANDLER_RELEASE_VERSION_LOC_HI) << 8)) !==              // Handler version is not the same as ROM version
    ((releaseVersion[0] << 8) + releaseVersion[1])){
        rom.wordAt(address.HANDLER_RELEASE_PREV_VERSION_LOC) = rom.wordAt(address.HANDLER_RELEASE_VERSION_LOC);     // Write old version to prev version slot
    }
    
    // Write version to ROM
    rom.byteAt(address.HANDLER_RELEASE_VERSION_LOC) = releaseVersion[1];
    rom.byteAt(address.HANDLER_RELEASE_VERSION_LOC + 1) = releaseVersion[0];
}

/** restrict textbox input to numbers only */
function keyHandler() {
    var key = window.event.keyCode;

    if ((key < 48) || (key > 57)) window.event.keyCode = 0;
}

/** restrict input to numbers , '-' and handle enter key */
function keyHandlerWneg(id) {
    var key = window.event.keyCode;
    if (key != 0x2d && (key < 48) || (key > 57)) window.event.keyCode = 0x0;
    if (key == 0xd) constrainThenWriteMultiplier(id);

}



// ****** Fuel Multiplier Functions ******

/** Convert percentage value to table multiplier value */
function _percentToMultiplier(percent) {
    var xplier = Math.round(((100 + percent) * 512) / 100);
    return xplier;
}

/** Convert table multiplier value to percentage value */
function _multiplierToPercent(xplier) {
    return ((xplier * 100) / 512) - 100;
}

/** Split high and low byte, then write value to ROM addresses */
function _writeMultiplierToROM(xplier) {
    rom.byteAt(address.RP7_FUEL_XPLIER_MSB_LOC) = xplier >> 8;
    rom.byteAt(address.RP7_FUEL_XPLIER_LSB_LOC) = xplier & 0xff;
}

/** Constrain Multiplier TextBox value then write to ROM */
function constrainThenWriteMultiplier(id) {
    var oldValue = id.value;
    var newValue = Math.max(-99, Math.min(400, oldValue));
    id.value = newValue;
    if (oldValue != newValue) alert("Valid range: -99 to 400");
    _writeMultiplierToROM(_percentToMultiplier(parseInt(id.value)));
    window.external.refresh();
}

// *********** Checkbox feature handling ********************
// **********************************************************

// ************** Feature Handlers **************************



// Option Status Bytes
var RPJumperCol1Bits = 0;
var RPJumperCol2Bits = 0;
var RPJumperCol3Bits = 0;
var ScanToolOverideStatus = 0;





/** Call all handlers */
function callHandlers() {
    var updateROM = false;
    handle_speedLimit(updateROM);
    handle_EGR(updateROM);
    handle_o2Sensor(updateROM);
    handle_o2Heater(updateROM);
    handle_VTECSpeedCheck(updateROM);
    handle_VTECTempCheck(updateROM);
    handle_VTECPressureCheck(updateROM);
    handle_VTECFeedback(updateROM);
    // handle_debugMode(updateROM); // Removed 
    handle_checksumAndRunaway(updateROM);
    handle_IACV(updateROM);
    handle_VSS(updateROM);
    handle_ECUCompatibility(updateROM);
    handle_VTECcelLightIndicator(updateROM);
    handle_VTECalternateOutput(updateROM);
    handle_VTEC_IABOut(updateROM);
    handle_VTEC_ICSOut(updateROM);
    handle_VTEC_A10Out(updateROM);
    handle_VTEC_PurgeOut(updateROM);
    handle_IgnitionCut(updateROM);
    handle_FuelMultiplier(updateROM);
    handle_forceFuelTable(updateROM);
    handle_disableFuelComps(updateROM);
    handle_largerFuelRange(updateROM);

}

/** Adds or remove the patch code and hooks to force RP jumper results 
 * @param mode read / add / remove
 * @param column Which feature column from table 6cff
*/
function rpJumperHandler(mode, column) {
    // Adds / Removes code that allows the user to control RP jumper options not normally set for an ECU
    // Returns the address enable / disable bit masks for the given column
    // Modes:
    // read = returns col enable /disable byte addresses only - Returns 0x8000 on error
    // write = adds code to rom if not already present
    // remove = remove code from ROM if present and unused
    // Call this function to add the code, then write whatever bits you want to enable or disable
    // to the enable / disable bit masks.
    var enableByteLoc = 0x8000;
    var disableByteLoc = 0x8000;
    
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
    var RP_FORCE_JMPR_PATCH_CODE_COL1 = [0x99, 0xD0, 0xD6, 0xFF, 0xE6, 0x00, 0x88, 0x01];
    var RP_FORCE_JMPR_PATCH_CODE_COL2 = [0x99, 0xA2, 0xD6, 0xFF, 0xE6, 0x00, 0x88, 0x01];
    var RP_FORCE_JMPR_PATCH_CODE_COL3 = [0x99, 0xF8, 0xD6, 0xFF, 0xE6, 0x00, 0x88, 0x01];
    
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
        if (rom.byteAt(address.RP_FORCE_JMPR_FUNC_LOC_MAIN) == 0xff) {

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
        }
    }

    // remove patch code and hooks from ROM if it's present and not being used
    if (mode == "remove") {
        if (rom.byteAt(address.RP_FORCE_JMPR_FUNC_LOC_MAIN) != 0xff
            && RPJumperCol1Bits == 0
            && RPJumperCol2Bits == 0
            && RPJumperCol3Bits == 0) {

            // blank the patch code area
            var RPForcePatchCodeSize = RP_FORCE_JMPR_PATCH_CODE_COL1.length + RP_FORCE_JMPR_PATCH_CODE_COL2.length + RP_FORCE_JMPR_PATCH_CODE_COL3.length;
            P13.rom_fill(address.RP_FORCE_JMPR_FUNC_LOC_MAIN, address.RP_FORCE_JMPR_FUNC_LOC_MAIN + RPForcePatchCodeSize - 1, 0xff);

            // restore the stock code
            P13.rom_write(RP_FORCE_JMPR_HOOK_LOC_COL1, RP_FORCE_JMPR_HOOK1_STOCK_CODE, RP_FORCE_JMPR_HOOK1_STOCK_CODE.length);
            P13.rom_write(RP_FORCE_JMPR_HOOK_LOC_COL2, RP_FORCE_JMPR_HOOK2_STOCK_CODE, RP_FORCE_JMPR_HOOK2_STOCK_CODE.length);
            P13.rom_write(RP_FORCE_JMPR_HOOK_LOC_COL3, RP_FORCE_JMPR_HOOK3_STOCK_CODE, RP_FORCE_JMPR_HOOK3_STOCK_CODE.length);
        }
    }

    // Return addresses of bit masks for column requested by caller
    if (column == 1) {
        enableByteLoc = RP_FORCE_JMPR_COL1_ENABLE_BYTE_LOC;
        disableByteLoc = RP_FORCE_JMPR_COL1_DISABLE_BYTE_LOC;
    }
    if (column == 2) {
        enableByteLoc = RP_FORCE_JMPR_COL2_ENABLE_BYTE_LOC;
        disableByteLoc = RP_FORCE_JMPR_COL2_DISABLE_BYTE_LOC;
    }
    if (column == 3) {
        enableByteLoc = RP_FORCE_JMPR_COL3_ENABLE_BYTE_LOC;
        disableByteLoc = RP_FORCE_JMPR_COL3_DISABLE_BYTE_LOC;
    }
    return{
        enableByteLoc: enableByteLoc,
        enableByteVal: rom.byteAt(enableByteLoc),
        disableByteLoc: disableByteLoc,
        disableByteVal: rom.byteAt(disableByteLoc)
    };
}

/** Add or remove code to override the built in scan tool options */
function addRemScanToolOverride(addCode) {
    // Adds code to insert our own value into the scan tool commanded registers
    // Whatever byte is written to [SCANTOOL_OVERRIDE_PATCH_LOC + 1] will be written to the registers
    var SCANTOOL_OVERRIDE_PATCH_LOC = 0x3971;
    var SCANTOOL_OVERRIDE_PATCH_CODE = new Array(0x77, 0x00, 0x00);
    var SCANTOOL_OVERRIDE_STOCK_CODE = new Array(0x20, 0x11, 0x78);

    if (addCode) {
        if (rom.byteAt(SCANTOOL_OVERRIDE_PATCH_LOC) == 0x20) {
            P13.rom_write(SCANTOOL_OVERRIDE_PATCH_LOC, SCANTOOL_OVERRIDE_PATCH_CODE, SCANTOOL_OVERRIDE_PATCH_CODE.length);
        }
    }

    // Restore original code
    else {
        // Only restore original code if it's been changed, and no patch options are using it
        if (rom.byteAt(SCANTOOL_OVERRIDE_PATCH_LOC) != 0x20 && ScanToolOverideStatus == 0) {
            P13.rom_write(SCANTOOL_OVERRIDE_PATCH_LOC, SCANTOOL_OVERRIDE_STOCK_CODE, SCANTOOL_OVERRIDE_PATCH_CODE.length);
        }
    }
}


/** Speed Limiter modifier */
function handle_speedLimit(toROM) {
    // Legacy code to modify speed limit value.  
    // I'm pretty sure the speed limit is inactive in US P13 ROM due to RP jumper configs.
    if (toROM) {
        if (Optionfrm.SpdLimitBox.checked == true) {
            Optionfrm.txtSpdLimit.disabled = false;
            rom.byteAt(rom.addressOf('SPEED_LIMIT')) = Math.min(0xFF, Optionfrm.txtSpdLimit.value);
        }
        else {
            Optionfrm.txtSpdLimit.value = 255;
            Optionfrm.txtSpdLimit.disabled = true;
        }
        return;
    }
    Optionfrm.txtSpdLimit.value = rom.byteAt(rom.addressOf('SPEED_LIMIT'));
    if (rom.byteAt(rom.addressOf('SPEED_LIMIT')) == 0xFF) {
        Optionfrm.SpdLimitBox.checked = false;
        Optionfrm.txtSpdLimit.disabled = true;
    }

    else {
        Optionfrm.SpdLimitBox.checked = true;
        Optionfrm.txtSpdLimit.disabled = false;
    }

}

/** EGR Disable */
function handle_EGR(toROM) {
    // Changes a conditional jump to always jump to "Disable EGR Valve" code.
    var patchLoc = address.EGR_DISABLE_PATCH_LOC;
    var EGR_DISABLE_PATCH_CODE = 0xcb;
    var EGR_DISABLE_STOCK_CODE = 0xca;

    // Using extended fuel / ign tables. Disable EGR control.
    if(rom.byteAt(address.TABLES_USING_STANDARD_SIZE) == 0x00){
        Optionfrm.EGRBox.disabled = true;
    }
    else{
    if (toROM) {
        // Disable EGR
        if (Optionfrm.EGRBox.checked == true) {
            rom.byteAt(patchLoc) = EGR_DISABLE_PATCH_CODE;
        }
        else {
            rom.byteAt(patchLoc) = EGR_DISABLE_STOCK_CODE;
        }

        return;
    }
    }


    Optionfrm.EGRBox.checked = false;
    if (rom.byteAt(patchLoc) != EGR_DISABLE_STOCK_CODE) {
        Optionfrm.EGRBox.checked = true;
    }
}

/** O2 Sensor / Close loop disable */
function handle_o2Sensor(toROM) {
    // Always sets the "ECT-warm-enough-for-close-loop" flag to 0.
    var O2_SENSOR_PATCH_LOC = 0x16f5;
    var O2_SENSOR_PATCH_CODE = 0x0a; // RB xx.x
    var O2_SENSOR_STOCK_CODE = 0x3a; // MB xx.x , C

    if (toROM) {
        if (Optionfrm.OxyBox.checked == true) {
            rom.byteAt(O2_SENSOR_PATCH_LOC) = O2_SENSOR_PATCH_CODE;
        } else {
            rom.byteAt(O2_SENSOR_PATCH_LOC) = O2_SENSOR_STOCK_CODE;
        }
        return;
    }

    Optionfrm.OxyBox.checked = false;
    if (rom.byteAt(O2_SENSOR_PATCH_LOC) != O2_SENSOR_STOCK_CODE) {
        Optionfrm.OxyBox.checked = true;
    }
}

/** O2 Heater disable */
function handle_o2Heater(toROM) {
    // Changes a conditional jump to always jump to set the "Use-O2-Heater" flag to 0.
    var O2_HEATER_PATCH_LOC = 0x1e85;
    var O2_HEATER_PATCH_CODE = 0xcb; // SJ
    var O2_HEATER_STOCK_CODE = 0xca; // JLT

    if (toROM) {
        if (Optionfrm.OxyHeatBox.checked == true) {
            rom.byteAt(O2_HEATER_PATCH_LOC) = O2_HEATER_PATCH_CODE;
        } else {
            rom.byteAt(O2_HEATER_PATCH_LOC) = O2_HEATER_STOCK_CODE;
        }
        return;
    }

    Optionfrm.OxyHeatBox.checked = false;
    if (rom.byteAt(O2_HEATER_PATCH_LOC) != O2_HEATER_STOCK_CODE) {
        Optionfrm.OxyHeatBox.checked = true;
    }
}

/** VTEC Speed Check Bypass */
function handle_VTECSpeedCheck(toROM) {
    // Changes the outcome of the VSS comparison to always return '1'
    var VTEC_SPEED_CHECK_PATCH_LOC = 0x359b;
    var VTEC_SPEED_CHECK_PATCH_CODE = 0x1c; // SB xx.x
    var VTEC_SPEED_CHECK_STOCK_CODE = 0x3c; // MB xx.x, C
    if (toROM) {
        if (Optionfrm.SpeedCheckBox.checked == true) {
            rom.byteAt(VTEC_SPEED_CHECK_PATCH_LOC) = VTEC_SPEED_CHECK_PATCH_CODE;
        } else {
            rom.byteAt(VTEC_SPEED_CHECK_PATCH_LOC) = VTEC_SPEED_CHECK_STOCK_CODE;
        }
        return;
    }

    Optionfrm.SpeedCheckBox.checked = false;
    if (rom.byteAt(VTEC_SPEED_CHECK_PATCH_LOC) != VTEC_SPEED_CHECK_STOCK_CODE) {
        Optionfrm.SpeedCheckBox.checked = true;
    }
}

/** VTEC Temp Check modifier */
function handle_VTECTempCheck(toROM) {
    // Changes the minimum VETC temperateure comparison value 
    var VTEC_ECT_MIN_LOC = 0x35ca;
    var VTEC_ECT_MIN_PATCH_VALUE = 0xff; // 121F
    var VTEC_ECT_MIN_STOCK_VALUE = 0x44; // -21F
    if (toROM) {
        if (Optionfrm.CoolCheckBox.checked == true) {
            rom.byteAt(VTEC_ECT_MIN_LOC) = VTEC_ECT_MIN_PATCH_VALUE;
        }
        else {
            rom.byteAt(VTEC_ECT_MIN_LOC) = VTEC_ECT_MIN_STOCK_VALUE;
        }
        return;
    }

    Optionfrm.CoolCheckBox.checked = false;
    if (rom.byteAt(VTEC_ECT_MIN_LOC) != VTEC_ECT_MIN_STOCK_VALUE) {
        Optionfrm.CoolCheckBox.checked = true;
    }
}

/** VTEC Pressure Check bypass */
function handle_VTECPressureCheck(toROM) {
    // Modifies the VTP error check to always return '0'
    // Modifies the VTEC Logic to remove dependancies on VTP status when switching HI/LO,  Fuel/Ign Tables
    var VTEC_VTP_ERROR_PATCH_LOC = 0x11e1;
    var VTEC_VTP_ERROR_PATCH_CODE = 0x09; // RB xx.x
    var VTEC_VTP_ERROR_STOCK_CODE = 0x39; // MB xx.x, C
    var VTEC_VTP_LOGIC_PATCH_LOC1 = 0x361d;
    var VTEC_VTP_LOGIC_PATCH_LOC2 = 0x3634;
    var VTEC_VTP_LOGIC_STOCK_CODE1 = new Array(0xEC, 0x25, 0x17); // JBS     off(00125h).4, label_3637
    var VTEC_VTP_LOGIC_STOCK_CODE2 = new Array(0xDC, 0x25, 0xE9); // JBR     off(00125h).4, label_3620

    if (toROM) {
        // Add patch code to ROM
        if (Optionfrm.PressCheckBox.checked == true) {
            rom.byteAt(VTEC_VTP_ERROR_PATCH_LOC) = VTEC_VTP_ERROR_PATCH_CODE; // Disables any VTP error
            P13.rom_fill(VTEC_VTP_LOGIC_PATCH_LOC1, VTEC_VTP_LOGIC_PATCH_LOC1 + VTEC_VTP_LOGIC_STOCK_CODE1.length - 1, 0x00); // NOP conditional jump
            P13.rom_fill(VTEC_VTP_LOGIC_PATCH_LOC2, VTEC_VTP_LOGIC_PATCH_LOC2 + VTEC_VTP_LOGIC_STOCK_CODE2.length - 1, 0x00); // NOP conditional jump

        }
        // Remove patch code from ROM
        else {
            rom.byteAt(VTEC_VTP_ERROR_PATCH_LOC) = VTEC_VTP_ERROR_STOCK_CODE; // Restore stock error Checking
            P13.rom_write(VTEC_VTP_LOGIC_PATCH_LOC1, VTEC_VTP_LOGIC_STOCK_CODE1, VTEC_VTP_LOGIC_STOCK_CODE1.length);
            P13.rom_write(VTEC_VTP_LOGIC_PATCH_LOC2, VTEC_VTP_LOGIC_STOCK_CODE2, VTEC_VTP_LOGIC_STOCK_CODE2.length);
        }
        return;
    }
    Optionfrm.PressCheckBox.checked = false;
    if (rom.byteAt(VTEC_VTP_ERROR_PATCH_LOC) != VTEC_VTP_ERROR_STOCK_CODE) {
        Optionfrm.PressCheckBox.checked = true;
    }
}

/** VTEC Solenoid feedback */
function handle_VTECFeedback(toROM) {
    // Changes the SC to RC so the error flag will always be '0'
    var VTEC_FEEDBACK_PATCH_LOC = 0x11c2;
    var VTEC_FEEDBACK_PATCH_CODE = 0x95; // RC
    var VTEC_FEEDBACK_STOCK_CODE = 0x85; // SC

    if (toROM) {
        if (Optionfrm.SolCheckBox.checked == true) {
            rom.byteAt(VTEC_FEEDBACK_PATCH_LOC) = VTEC_FEEDBACK_PATCH_CODE;
        }
        else {
            rom.byteAt(VTEC_FEEDBACK_PATCH_LOC) = VTEC_FEEDBACK_STOCK_CODE;
        }
        return;
    }

    Optionfrm.SolCheckBox.checked = false;
    if (rom.byteAt(VTEC_FEEDBACK_PATCH_LOC) != VTEC_FEEDBACK_STOCK_CODE) {
        Optionfrm.SolCheckBox.checked = true;
    }
}

/* -- Removed. Not really much purpose
/** Debug Mode */
function handle_debugMode(toROM) {
    if (toROM) {
        if (Optionfrm.DebugBox.checked == true) {
            rom.byteAt(0x7FF1) = 0x00;
        }
        else {
            rom.byteAt(0x7FF1) = 0xFF;
        }
        return;
    }

    Optionfrm.DebugBox.checked = false;
    if (rom.byteAt(0x7FF1) != 0xFF) {
        Optionfrm.DebugBox.checked = true;
    }
}


/** remove ROM Checksum and remove runaway code check (patch bytes in P13Helper.js) */
function handle_checksumAndRunaway(toROM) {
    if (toROM) {
        P13.opt_setChecksumDisabled(Optionfrm.ChkSumCheckBox.checked == true);
        return;
    }

    Optionfrm.ChkSumCheckBox.checked = P13.opt_isChecksumDisabled();
}

/** IACV error bypass */
function handle_IACV(toROM) {
    // Modifies the IACV error check to always return '0'
    var IACV_ERROR_PATCH_LOC = 0x1815;
    var IACV_ERROR_PATCH_CODE = 0x0B; // RB xx.x
    var IACV_ERROR_STOCK_CODE = 0x3B; // MB xx.x, C
    if (toROM) {
        if (Optionfrm.IACVBox.checked == true) {
            rom.byteAt(IACV_ERROR_PATCH_LOC) = IACV_ERROR_PATCH_CODE;
        }
        else {
            rom.byteAt(IACV_ERROR_PATCH_LOC) = IACV_ERROR_STOCK_CODE;
        }
        return;
    }

    Optionfrm.IACVBox.checked = false;
    if (rom.byteAt(IACV_ERROR_PATCH_LOC) != IACV_ERROR_STOCK_CODE) {
        Optionfrm.IACVBox.checked = true;
    }
}

/** VSS Code 17 error bypass */
function handle_VSS(toROM) {
    // Modifies the Code 17 error check to always return '0'
    var CODE17_ERROR_PATCH_LOC = 0x1657;
    var CODE17_ERROR_PATCH_CODE = 0x0C; // RB xx.x
    var CODE17_ERROR_STOCK_CODE = 0x3C; // MB xx.x, C

    if (toROM) {
        if (Optionfrm.VSSCode17box.checked == true) {
            rom.byteAt(CODE17_ERROR_PATCH_LOC) = CODE17_ERROR_PATCH_CODE;
        }
        else {
            rom.byteAt(CODE17_ERROR_PATCH_LOC) = CODE17_ERROR_STOCK_CODE;
        }
        return;
    }

    Optionfrm.VSSCode17box.checked = false;
    if (rom.byteAt(CODE17_ERROR_PATCH_LOC) != CODE17_ERROR_STOCK_CODE) {
        Optionfrm.VSSCode17box.checked = true;
    }
}

/** ECU Compatibilty (patch bytes and notes in P13Helper.js) */
function handle_ECUCompatibility(toROM) {
    if (toROM) {
        P13.opt_setECUCompatibility(Optionfrm.P12Compatbox.checked == true);
        return;
    }

    Optionfrm.P12Compatbox.checked = P13.opt_isECUCompatibilityOn();
}

// Handle transmission type checkboxes and states
var wasAuto = false;
function getTransmissionCboxState() {
    // Jumper states (Only using 0, 2 and 4 for now)
    // 0 = 5 Speed / -
    // 1 = 5 speed / Idle option
    // 2 = Auto / -
    // 3 = Auto / Idle option
    // 4 = Use physical jumpers

    var state = 4;

    // Make sure only 1 box is checked part 1 of 2
    if (Optionfrm.Force5spdCbox.checked == true) {
        if (wasAuto) {
            Optionfrm.ForceAutoCbox.checked = false;
        }
        wasAuto = false;

    }
    // Make sure only 1 box is checked part 2 of 2
    if (Optionfrm.ForceAutoCbox.checked) {
        wasAuto = true;
        Optionfrm.Force5spdCbox.checked = false;
    }

    // Set the state
    if (Optionfrm.Force5spdCbox.checked == true) {
        state = 0;
    }
    else if (Optionfrm.ForceAutoCbox.checked) {
        state = 2;
    }
    else {
        state = 4;
    }
    return state;
}


/** VTEC CEL Light */
function handle_VTECcelLightIndicator(toROM) {
    // This code activates the MIL light while VTEC solenoid is on.
    // Since MIL and VTS are both triggered through the same register, we just
    // exclude and include the MIL bit during the VTEC logic to turn MIL on
    // MIL is turned off later by hooking the IO function at label_1a4b
    // Here the code performs stock when VTEC is inactive, and forces MIL when active
    // This implementation should keep the MIL performaning as normal, with the addition 
    // of using it as a VTEC indicator
    var VTEC_MIL_INIT_LOC = 0x35e9;
    var VTEC_MIL_INIT_PATCH_VALUE = 0xc8;
    var VTEC_MIL_INIT_STOCK_VALUE = 0xc0;
    var VTEC_MIL_INIT_MASK_LOC1 = 0x3604;
    var VTEC_MIL_INIT_MASK_LOC2 = 0x3619;
    var VTEC_MIL_INIT_MASK_PATCH = 0x77;
    var VTEC_MIL_INIT_MASK_STOCK = 0x7f;
    var VTEC_MIL_HOOK_LOC = 0x1a4b;
    var VTEC_MIL_HOOK_STOCK_CODE = new Array(0xc4, 0x26, 0x3b);
    var VTEC_MIL_FUNC_CODE = new Array(0xd9, 0x1a, 0x01, 0x85, 0xc4, 0x26, 0x3b, 0x01);

    if (toROM) {
        if (Optionfrm.VtecCelbox.checked == true) {
            // Enable MIL Bit while activating VETC
            rom.byteAt(VTEC_MIL_INIT_LOC) = VTEC_MIL_INIT_PATCH_VALUE;

            // Mask out MIL bit while deactivating VTEC
            rom.byteAt(VTEC_MIL_INIT_MASK_LOC1) = VTEC_MIL_INIT_MASK_PATCH;

            // Mask out MIL bit while deactivating VTEC
            rom.byteAt(VTEC_MIL_INIT_MASK_LOC2) = VTEC_MIL_INIT_MASK_PATCH;

            // Write the call to our MIL handler function
            rom.byteAt(VTEC_MIL_HOOK_LOC) = 0x32; // CAL
            rom.wordAt(VTEC_MIL_HOOK_LOC + 1) = address.VTEC_MIL_FUNC_LOC;

            // Write the MIL handler function to ROM
            P13.rom_write(address.VTEC_MIL_FUNC_LOC, VTEC_MIL_FUNC_CODE, VTEC_MIL_FUNC_CODE.length);

        }
        else if (Optionfrm.VtecCelbox.checked == false) {
            // Restore stock ROM code
            rom.byteAt(VTEC_MIL_INIT_LOC) = VTEC_MIL_INIT_STOCK_VALUE;
            rom.byteAt(VTEC_MIL_INIT_MASK_LOC1) = VTEC_MIL_INIT_MASK_STOCK;
            rom.byteAt(VTEC_MIL_INIT_MASK_LOC2) = VTEC_MIL_INIT_MASK_STOCK;
            P13.rom_write(VTEC_MIL_HOOK_LOC, VTEC_MIL_HOOK_STOCK_CODE, VTEC_MIL_HOOK_STOCK_CODE.length);
            P13.rom_fill(address.VTEC_MIL_FUNC_LOC, address.VTEC_MIL_FUNC_LOC + VTEC_MIL_FUNC_CODE.length - 1, 0xff);
        }
        return;
    }

    Optionfrm.VtecCelbox.checked = false;
    if (rom.byteAt(address.VTEC_MIL_FUNC_LOC) != 0xff) {
        Optionfrm.VtecCelbox.checked = true;
    }
}

/** Alt VTEC - Handler */
function handle_VTECalternateOutput(toROM) {
    // This function adds a custom handler to the ROM to handle additional VTEC outputs using 82c55 port B
    // When vtec logic is finished and the IO is about to be updated, the handler will be called
    // and update the IO with the additional outputs.
    // To activate an output on 82c55 B , add its bit to the byte located at the handler address + 2
    // and then disable the ROMS handling of that output elsewhere
    var ALT_VTEC_HOOK_LOC = 0x3650;
    var ALT_VTEC_HOOK_STOCK_CODE = new Array(0xd2, 0xa2, 0x18);
    var ALT_VTEC_FUNC_CODE = new Array(
        0xD2, 0x77, 0x00, 0x8F, 0xF6, 0xFF, 0x8E, 0xF3,
        0xA5, 0x5E, 0x20, 0xD0, 0xC0, 0x20, 0xC0, 0xC0,
        0xCE, 0x01, 0x6F, 0xD3, 0xA5, 0xF6, 0xFF, 0x62,
        0x00, 0xA0, 0xD2, 0xA2, 0x18, 0x01);

    if (toROM) {
        if (Optionfrm.EnableAltVtec.checked == true) {

            // Enable sub-check boxes
            Optionfrm.AltVtecIAB.disabled = false;
            Optionfrm.AltVtecICS.disabled = false;
            Optionfrm.AltVtecA10.disabled = false;
            Optionfrm.AltVtecPurge.disabled = false;

            // Hook to our code before 82c55 write
            rom.byteAt(ALT_VTEC_HOOK_LOC) = 0x32; // CAL
            rom.wordAt(ALT_VTEC_HOOK_LOC + 1) = address.ALT_VTEC_FUNC_LOC;

            // Write the handler function to ROM
            P13.rom_write(address.ALT_VTEC_FUNC_LOC, ALT_VTEC_FUNC_CODE, ALT_VTEC_FUNC_CODE.length);
        }
        else {
            // Alt VTEC disabled, remove all output patches, and disable checkboxes
            Optionfrm.AltVtecIAB.checked = false;
            optionSelect(26);
            Optionfrm.AltVtecIAB.disabled = true;

            Optionfrm.AltVtecICS.checked = false;
            optionSelect(27);
            Optionfrm.AltVtecICS.disabled = true;

            Optionfrm.AltVtecA10.checked = false;
            optionSelect(28);
            Optionfrm.AltVtecA10.disabled = true;

            Optionfrm.AltVtecPurge.checked = false;
            optionSelect(29);
            Optionfrm.AltVtecPurge.disabled = true;

            // Remove Hook, and handler
            P13.rom_write(ALT_VTEC_HOOK_LOC, ALT_VTEC_HOOK_STOCK_CODE, ALT_VTEC_HOOK_STOCK_CODE.length);
            P13.rom_fill(address.ALT_VTEC_FUNC_LOC, address.ALT_VTEC_FUNC_LOC + ALT_VTEC_FUNC_CODE.length - 1, 0xff);

        }
        return;
    }


    Optionfrm.EnableAltVtec.checked = false;
    Optionfrm.AltVtecIAB.disabled = true;
    Optionfrm.AltVtecICS.disabled = true;
    Optionfrm.AltVtecA10.disabled = true;
    Optionfrm.AltVtecPurge.disabled = true;
    if (rom.byteAt(address.ALT_VTEC_FUNC_LOC) != 0xff) {
        Optionfrm.EnableAltVtec.checked = true;
        Optionfrm.AltVtecIAB.disabled = false;
        Optionfrm.AltVtecICS.disabled = false;
        Optionfrm.AltVtecA10.disabled = false;
        Optionfrm.AltVtecPurge.disabled = false;
    }
}

/** Alt VTEC - IAB out */
function handle_VTEC_IABOut(toROM) {
    // Updates Alt vtec handler to enable this output, and removes the stock ROMs ability to control it
    var ALT_VTEC_IAB_PATCH_LOC = 0x1b9f;
    var ALT_VTEC_IAB_STOCK_CODE = new Array(0xc4, 0x25, 0x3c);
    var ALT_VTEC_IAB_SET_BIT = 4;

    if (toROM) {
        if (Optionfrm.AltVtecIAB.checked == true) {
            // 'NOP' code where the ROM would normally write to 225h register
            P13.rom_fill(ALT_VTEC_IAB_PATCH_LOC, ALT_VTEC_IAB_PATCH_LOC + ALT_VTEC_IAB_STOCK_CODE.length - 1, 0x00);

            // Update alt VTEC handler code to enable output
            rom.byteAt(address.ALT_VTEC_PORTB_LOC) |= (1 << ALT_VTEC_IAB_SET_BIT);
        }
        else {
            P13.rom_write(ALT_VTEC_IAB_PATCH_LOC, ALT_VTEC_IAB_STOCK_CODE, ALT_VTEC_IAB_STOCK_CODE.length);
            rom.byteAt(address.ALT_VTEC_PORTB_LOC) &= ~(1 << ALT_VTEC_IAB_SET_BIT);
        }
        return;
    }


    Optionfrm.AltVtecIAB.checked = false;
    if (rom.byteAt(ALT_VTEC_IAB_PATCH_LOC) != ALT_VTEC_IAB_STOCK_CODE[0]) {
        Optionfrm.AltVtecIAB.checked = true;
    }
}

/** Alt VTEC - ICS out */
function handle_VTEC_ICSOut(toROM) {
    // Updates Alt vtec handler to enable this output, and removes the stock ROMs ability to control it
    var ALT_VTEC_ICS_PATCH_LOC = 0x1bac;
    var ALT_VTEC_ICS_STOCK_CODE = new Array(0xc4, 0x25, 0x3d);
    var ALT_VTEC_ICS_SET_BIT = 5;

    if (toROM) {
        if (Optionfrm.AltVtecICS.checked == true) {
            // 'NOP' code where the ROM would normally write to 225h register
            P13.rom_fill(ALT_VTEC_ICS_PATCH_LOC, ALT_VTEC_ICS_PATCH_LOC + ALT_VTEC_ICS_STOCK_CODE.length - 1, 0x00);

            // Update alt VTEC handler code to enable output
            rom.byteAt(address.ALT_VTEC_PORTB_LOC) |= (1 << ALT_VTEC_ICS_SET_BIT);
        }
        else {
            P13.rom_write(ALT_VTEC_ICS_PATCH_LOC, ALT_VTEC_ICS_STOCK_CODE, ALT_VTEC_ICS_STOCK_CODE.length);
            rom.byteAt(address.ALT_VTEC_PORTB_LOC) &= ~(1 << ALT_VTEC_ICS_SET_BIT);
        }
        return;
    }


    Optionfrm.AltVtecICS.checked = false;
    if (rom.byteAt(ALT_VTEC_ICS_PATCH_LOC) != ALT_VTEC_ICS_STOCK_CODE[0]) {
        Optionfrm.AltVtecICS.checked = true;
    }
}

/** Alt VTEC - A10 out */
function handle_VTEC_A10Out(toROM) {
    // Updates Alt vtec handler to enable this output, and removes the stock ROMs ability to interact with it
    var ALT_VTEC_A10_PATCH_LOC1 = 0x1bce;
    var ALT_VTEC_A10_STOCK_CODE1 = new Array(0xc4, 0x25, 0x3e);
    var ALT_VTEC_A10_PATCH_LOC2 = 0x1694;
    var ALT_VTEC_A10_STOCK_CODE2 = new Array(0xee, 0x25, 0x20);
    var ALT_VTEC_A10_PATCH_CODE2 = new Array(0xeb, 0x15, 0x20);
    var ALT_VTEC_A10_SET_BIT = 6;

    if (toROM) {
        if (Optionfrm.AltVtecA10.checked == true) {
            // 'NOP' code where the ROM would normally interact with this output
            P13.rom_fill(ALT_VTEC_A10_PATCH_LOC1, ALT_VTEC_A10_PATCH_LOC1 + ALT_VTEC_A10_STOCK_CODE1.length - 1, 0x00);

            // Re-route logic that uses the port register, to instead use a flag that was set using the same logic
            P13.rom_write(ALT_VTEC_A10_PATCH_LOC2, ALT_VTEC_A10_PATCH_CODE2, ALT_VTEC_A10_PATCH_CODE2.length);

            // Update alt VTEC handler code to enable output
            rom.byteAt(address.ALT_VTEC_PORTB_LOC) |= (1 << ALT_VTEC_A10_SET_BIT);
        }
        else {
            // Re-store stock code
            P13.rom_write(ALT_VTEC_A10_PATCH_LOC1, ALT_VTEC_A10_STOCK_CODE1, ALT_VTEC_A10_STOCK_CODE1.length);
            P13.rom_write(ALT_VTEC_A10_PATCH_LOC2, ALT_VTEC_A10_STOCK_CODE2, ALT_VTEC_A10_STOCK_CODE2.length);
            rom.byteAt(address.ALT_VTEC_PORTB_LOC) &= ~(1 << ALT_VTEC_A10_SET_BIT);
        }
        return;
    }


    Optionfrm.AltVtecA10.checked = false;
    if (rom.byteAt(ALT_VTEC_A10_PATCH_LOC1) != ALT_VTEC_A10_STOCK_CODE1[0]) {
        Optionfrm.AltVtecA10.checked = true;
    }
}

/** Alt VTEC - PURGE out */
function handle_VTEC_PurgeOut(toROM) {
    // Updates Alt vtec handler to enable this output, and removes the stock ROMs ability to control it
    var ALT_VTEC_PURGE_PATCH_LOC = 0x1b92;
    var ALT_VTEC_PURGE_STOCK_CODE = new Array(0xc4, 0x25, 0x3f);
    var ALT_VTEC_PURGE_SET_BIT = 7;

    if (toROM) {
        if (Optionfrm.AltVtecPurge.checked == true) {
            // 'NOP' code where the ROM would normally write to 225h register
            P13.rom_fill(ALT_VTEC_PURGE_PATCH_LOC, ALT_VTEC_PURGE_PATCH_LOC + ALT_VTEC_PURGE_STOCK_CODE.length - 1, 0x00);

            // Update alt VTEC handler code to enable output
            rom.byteAt(address.ALT_VTEC_PORTB_LOC) |= (1 << ALT_VTEC_PURGE_SET_BIT);
        }
        else {
            P13.rom_write(ALT_VTEC_PURGE_PATCH_LOC, ALT_VTEC_PURGE_STOCK_CODE, ALT_VTEC_PURGE_STOCK_CODE.length);
            rom.byteAt(address.ALT_VTEC_PORTB_LOC) &= ~(1 << ALT_VTEC_PURGE_SET_BIT);
        }
        return;
    }


    Optionfrm.AltVtecPurge.checked = false;
    if (rom.byteAt(ALT_VTEC_PURGE_PATCH_LOC) != ALT_VTEC_PURGE_STOCK_CODE[0]) {
        Optionfrm.AltVtecPurge.checked = true;
    }
}

/** Ignition Cut handler */
function handle_IgnitionCut(toROM) {
    // This code hooks the calls that request an ignition timer value
    // If (11ah.4 (Fuel Cut)) {er0 = 0xcccc, C = 0}
    // else {Execute the stock timer generation function}
    // This method does cause a code 15 , so we also hook the area that checks for an error
    // and only check for errors when a fuel cut is not active
    // I'm sure there are better ways to implement all of this...
    var IGN_CUT_HOOK_LOC_1 = 0x27a7;
    var IGN_CUT_HOOK_LOC_2 = 0x27be;
    var IGN_CUT_HOOK_LOC_3 = 0x27d5;
    var IGN_CUT_HOOK_PATCH_CODE = address.IGN_CUT_MAIN_FUNC_LOC;
    var IGN_CUT_HOOK_STOCK_CODE = 0x46fb;
    var IGN_CUT_MAIN_FUNC_CODE = new Array(
        0x62, 0x1A, 0x01, 0xC2, 0x2C, 0xCD, 0x06, 0x67,
        0xCC, 0xCC, 0x88, 0x95, 0x01, 0x03, 0xFB, 0x46);
    var IGN_CUT_CODE15_FUNC_LOC = address.IGN_CUT_MAIN_FUNC_LOC + IGN_CUT_MAIN_FUNC_CODE.length;
    var IGN_CUT_CODE15_FUNC_CODE = new Array(
        0xEE, 0x11, 0x06, 0xEC, 0x1A, 0x03, 0x03, 0xD4,
        0x06, 0x03, 0xDC, 0x06);
    var IGN_CUT_CODE15_HOOK_LOC = 0x6d1;
    var IGN_CUT_CODE15_HOOK_STOCK_CODE = new Array(0xee, 0x11, 0x08);

    if (toROM) {
        if (Optionfrm.IgnitionCut.checked == true) {
            // Hook patches
            rom.wordAt(IGN_CUT_HOOK_LOC_1) = IGN_CUT_HOOK_PATCH_CODE;
            rom.wordAt(IGN_CUT_HOOK_LOC_2) = IGN_CUT_HOOK_PATCH_CODE;
            rom.wordAt(IGN_CUT_HOOK_LOC_3) = IGN_CUT_HOOK_PATCH_CODE;
            rom.byteAt(IGN_CUT_CODE15_HOOK_LOC) = 0x03; // J
            rom.wordAt(IGN_CUT_CODE15_HOOK_LOC + 1) = IGN_CUT_CODE15_FUNC_LOC;

            // Write handler
            P13.rom_write(address.IGN_CUT_MAIN_FUNC_LOC, IGN_CUT_MAIN_FUNC_CODE, IGN_CUT_MAIN_FUNC_CODE.length);

            // Write Code 15 Correction
            P13.rom_write(IGN_CUT_CODE15_FUNC_LOC, IGN_CUT_CODE15_FUNC_CODE, IGN_CUT_CODE15_FUNC_CODE.length);


        }
        else {
            // Remove Hook patches
            rom.wordAt(IGN_CUT_HOOK_LOC_1) = IGN_CUT_HOOK_STOCK_CODE;
            rom.wordAt(IGN_CUT_HOOK_LOC_2) = IGN_CUT_HOOK_STOCK_CODE;
            rom.wordAt(IGN_CUT_HOOK_LOC_3) = IGN_CUT_HOOK_STOCK_CODE;
            P13.rom_write(IGN_CUT_CODE15_HOOK_LOC, IGN_CUT_CODE15_HOOK_STOCK_CODE, IGN_CUT_CODE15_HOOK_STOCK_CODE.length);


            // Remove handler
            P13.rom_fill(address.IGN_CUT_MAIN_FUNC_LOC, address.IGN_CUT_MAIN_FUNC_LOC + IGN_CUT_MAIN_FUNC_CODE.length - 1, 0xff);

            // Remove Code 15 Correction
            P13.rom_fill(IGN_CUT_CODE15_FUNC_LOC, IGN_CUT_CODE15_FUNC_LOC + IGN_CUT_CODE15_FUNC_CODE.length - 1, 0xff);


        }
        return;
    }

    Optionfrm.IgnitionCut.checked = false;
    if (rom.byteAt(address.IGN_CUT_MAIN_FUNC_LOC) != 0xFF) {
        Optionfrm.IgnitionCut.checked = true;
    }
}

/** Fuel Multiplier handler */
function handle_FuelMultiplier(toROM) {
    // This takes control of a debug mode option honda used to adjust the fuel amount at it's base
    // before any trim adjustments.  Once the handler is installed, write to the MSB and LSB addresses
    // to make system wide linear fuel changes. 0x200 = no change.
    // Handler ignores RP jumper results and blindly inserts the values into the multipler code.
    var RP7_FUEL_XPLIER_PATCH_CODE = [0x02, 0x98, 0x00, 0xcb, 0x02];
    var RP7_FUEL_XPLIER_STOCK_CODE = [0x01, 0x20, 0xc0, 0x80, 0xcd];
    if (toROM) {
        // Apply multiplier patch
        if (Optionfrm.forceRP7box.checked == true) {
            Optionfrm.txtRP7Jumper.disabled = false;
            P13.rom_write(address.RP7_FUEL_XPLIER_PATCH_LOC, RP7_FUEL_XPLIER_PATCH_CODE, RP7_FUEL_XPLIER_PATCH_CODE.length)
            Optionfrm.txtRP7Jumper.value = 0;
            window.external.refresh();
        }
        // Undo multiplier patch
        else {
            Optionfrm.txtRP7Jumper.value = 0;
            Optionfrm.txtRP7Jumper.disabled = true;
            P13.rom_write(address.RP7_FUEL_XPLIER_PATCH_LOC, RP7_FUEL_XPLIER_STOCK_CODE, RP7_FUEL_XPLIER_STOCK_CODE.length)
            window.external.refresh();

        }
        return;
    }

    Optionfrm.forceRP7box.checked = false;
    Optionfrm.txtRP7Jumper.disabled = true;
    Optionfrm.txtRP7Jumper.value = 0;

    // Multiplier is patched. Get value
    if (rom.wordAt(address.RP7_FUEL_XPLIER_PATCH2_LOC) != 0xcd80) {
        Optionfrm.forceRP7box.checked = true;
        Optionfrm.txtRP7Jumper.disabled = false;
        Optionfrm.txtRP7Jumper.value = Math.round(_multiplierToPercent(P13.getCustomXplierValue()));
    }
}

/** Force fuel tables */
function handle_forceFuelTable(toROM) {
    // Forces 11c.5 = 1 , which persuades the ECU to use the trim table instead of presets.
    // All addons and trim values will still be used aferwards, this just starts with the fuel
    // table instead of an alternative lookup.
    // Fuel Cuts, overrun, limp mode and major running issues will override this.
    var FORCE_TRIM_TABLE_PATCH_LOC = 0x709b;
    var FORCE_TRIM_TABLE_PATCH_CODE = 0x1d;
    var FORCE_TRIM_TABLE_STOCK_CODE = 0x3d;
    if (toROM) {
        if (Optionfrm.RestrictECU.checked == true) {
            rom.byteAt(FORCE_TRIM_TABLE_PATCH_LOC) = FORCE_TRIM_TABLE_PATCH_CODE;
        }
        else {
            rom.byteAt(FORCE_TRIM_TABLE_PATCH_LOC) = FORCE_TRIM_TABLE_STOCK_CODE;
        }
        return;
    }

    Optionfrm.RestrictECU.checked = false;
    if (rom.byteAt(FORCE_TRIM_TABLE_PATCH_LOC) != FORCE_TRIM_TABLE_STOCK_CODE) {
        Optionfrm.RestrictECU.checked = true;
    }
}

/** Force table value by disabling most fuel compensations */
function handle_disableFuelComps(toROM) {
    /** Fuel:
     *  Instead of adjusting the main fuel base by moving (00150h) into er0,
     *  use the fuel table value in (00193h). er0 = (00193h) << 2 or << 3 when using larger fuel range
     *  This code just changes the 0x80 base table value in to 0x200 base 
     *  that the final adjustment expects.
     * 
     * org 0x336f
     *  CAL     patchArea               ; 336f  32 LL HH 
     *                                  ;  orig: MOV er0, off(00150h) B4 50 48
     *   
     *  patchArea:
     *      CLR     er0                 ; 44 15         Clear multiplier
     *      MOVB    r0, off(00193h)     ; C4 93 48      get our table value
     *      SLL     er0                 ; 44 D7         Shift the base
     *      SLL     er0                 ; 44 D7
     *      PUSHS   A                   ; 55            Preserve A 
     *      LCB     USE_STOCK_FUEL_RANGE; 90 9D BF 7F   Using extended fuel table range?
     *      JNE     goReturn            ; CE 02         Nope, stock fuel. return back
     *      SLL     er0                 ; 44 D7         Yep, shift again to match base
     *goReturn:
     *      POPS    A                   ; 65            Restore A
     *      RT                          ; 01            Return
     * 
    */
    var patchLocation = address.DISABLE_FUEL_ADJ_CUSTOM_CODE_LOC;
    var stockFuelAddress = P13.addressToBytes(address.USE_STOCK_FUEL_RANGE);
    var DISABLE_FUEL_ADJ_HOOK_LOC = 0x336f;
    var DISABLE_FUEL_ADJ_HOOK_STOCK = [0xb4, 0x50, 0x48];
    var DISABLE_FUEL_ADJ_HOOK_PATCHED = [0x32, patchLocation & 0xff, patchLocation >> 8]
    var DISABLE_FUEL_ADJ_CUSTOM_CODE = [
        0x44, 0x15, 0xc4, 0x93, 0x48, 0x44, 0xd7, 0x44, 0xd7, 0x55,
        0x90, 0x9d, stockFuelAddress[1], stockFuelAddress[0], 0xce, 0x02, 0x44, 0xd7, 0x65, 0x01
    ];
    

    if (toROM) {
        if (Optionfrm.ForceTable.checked == true) {
            // Fuel
            P13.rom_write(patchLocation, DISABLE_FUEL_ADJ_CUSTOM_CODE, DISABLE_FUEL_ADJ_CUSTOM_CODE.length);
            P13.rom_write(DISABLE_FUEL_ADJ_HOOK_LOC, DISABLE_FUEL_ADJ_HOOK_PATCHED, DISABLE_FUEL_ADJ_HOOK_PATCHED.length);
        }
        else {
            // Fuel
            P13.rom_fill(patchLocation, patchLocation + DISABLE_FUEL_ADJ_CUSTOM_CODE.length -1, 0xff );
            P13.rom_write(DISABLE_FUEL_ADJ_HOOK_LOC, DISABLE_FUEL_ADJ_HOOK_STOCK, DISABLE_FUEL_ADJ_HOOK_STOCK.length);
        }
        return;
    }

    Optionfrm.ForceTable.checked = false;
    if (rom.byteAt(DISABLE_FUEL_ADJ_HOOK_LOC) == DISABLE_FUEL_ADJ_HOOK_PATCHED[0]) {
        Optionfrm.ForceTable.checked = true;
    }
}


/**Enable a larger range of fuel values in the tables */
function handle_largerFuelRange(toROM){
    /**Removes a ROM command to shift right all the fuel table values after lookup.
     * Expands the upper fuel range boundary 
     * Divides all the table values in half to balance this.
     * Sets ROM flag byte so handler is informed
     * This changes our previous table range from 
     *  0xB0 - 0x80 = Stock 48 Possible fuel table values
     *  0x58 - 0x40 = Stock 24 actual adjustments allowed
     *  0xff - 0x40 = Patched 191 adjustment values allowed.
     */
    var LARGER_FUEL_RANGE_PATCH1_LOC = address.LARGER_FUEL_RANGE_PATCH1_LOC;
    var LARGER_FUEL_RANGE_PATCH1 = 0x00; // NOP
    var LARGER_FUEL_RANGE_STOCK1 = 0x63; // SRLB A (TableValue / 2)
    var LARGER_FUEL_RANGE_UPPER_BOUNDARY_LOC = address.FUEL_TABLE_MAX_VALUE_LOC;
    var LARGER_FUEL_RANGE_UPPER_BOUNDARY_PATCHED = 0xff;
    var LARGER_FUEL_RANGE_UPPER_BOUNDARY_STOCK = address.FUEL_TABLE_MIN_MAX_DEFAULT_VALUE;
    var stockCellMax = P13.constrainByte(LARGER_FUEL_RANGE_UPPER_BOUNDARY_STOCK * 2);
    var usingStockFuelLoc = address.USE_STOCK_FUEL_RANGE;
    
    if(toROM){
        // Fuel tables to arrays
        var tableSize = P13.getTableSize();
        var lowFuelTable = P13.CreateArrayFromTable(rom.addressOf('LOW_FUEL'), tableSize.width, tableSize.height);
        var hiFuelTable = P13.CreateArrayFromTable(rom.addressOf('HIGH_FUEL'), tableSize.width, tableSize.height);
        
        if(Optionfrm.LargerFuelSpan.checked == true){
            // Enable 
            rom.byteAt(LARGER_FUEL_RANGE_PATCH1_LOC) = LARGER_FUEL_RANGE_PATCH1;
            rom.byteAt(LARGER_FUEL_RANGE_UPPER_BOUNDARY_LOC) = LARGER_FUEL_RANGE_UPPER_BOUNDARY_PATCHED;
            rom.byteAt(usingStockFuelLoc) = 0x00;

            // Divide table values by 2. The stock ECU halves each value after lookup (SRLB A),
            // so a stock cell 2k+1 was used as k. Floor keeps the fuel the ECU was using.
            var r, c;
            for (r = 0; r < lowFuelTable.length; r++) {
                for (c = 0; c < lowFuelTable[r].length; c++) {
                    lowFuelTable[r][c] = Math.floor(lowFuelTable[r][c] / 2);
                    hiFuelTable[r][c] = Math.floor(hiFuelTable[r][c] / 2);
                }
            }

            // Write tables to ROM
            P13.WriteArrayToROMTable(rom.addressOf('LOW_FUEL'), tableSize.width, tableSize.height, lowFuelTable);
            P13.WriteArrayToROMTable(rom.addressOf('HIGH_FUEL'), tableSize.width, tableSize.height, hiFuelTable);

        }
        else{
            // Disable
            rom.byteAt(LARGER_FUEL_RANGE_PATCH1_LOC) = LARGER_FUEL_RANGE_STOCK1;
            rom.byteAt(LARGER_FUEL_RANGE_UPPER_BOUNDARY_LOC) = LARGER_FUEL_RANGE_UPPER_BOUNDARY_STOCK;
            rom.byteAt(usingStockFuelLoc) = 0xFF;

            // Multiply table values by 2 and constrain to stock table limit size
            var r, c;
            for (r = 0; r < lowFuelTable.length; r++) {
                for (c = 0; c < lowFuelTable[r].length; c++) {
                    lowFuelTable[r][c] = Math.min(stockCellMax, P13.constrainByte(Math.floor(lowFuelTable[r][c] * 2)));
                    hiFuelTable[r][c] = Math.min(stockCellMax, P13.constrainByte(Math.floor(hiFuelTable[r][c] * 2)));
                }
            }
            
            // Write tables to ROM
            P13.WriteArrayToROMTable(rom.addressOf('LOW_FUEL'), tableSize.width, tableSize.height, lowFuelTable);
            P13.WriteArrayToROMTable(rom.addressOf('HIGH_FUEL'), tableSize.width, tableSize.height, hiFuelTable);
        }
    }
    Optionfrm.LargerFuelSpan.checked = false;
    if(rom.byteAt(usingStockFuelLoc) == 0x00){
        Optionfrm.LargerFuelSpan.checked = true;
    }
}

// ******************************************

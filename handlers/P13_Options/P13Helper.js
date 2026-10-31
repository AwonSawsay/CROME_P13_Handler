/*********************************************************************
P13 Helper functions for CROME
Auth: Awon (BiggieSmallBlock on pgmfi)
*********************************************************************
Contains general functions useful to P13 ROM handling
Access functions by using 'P13.function()'

Changelog:
    -v1.0   - Initial working release - March 2026
********************************************************************/

var P13_HELPER_VERSION = '1.0';
/// <reference path="./P13Addresses.js" />

var P13 = {
    
    //############### MAP Functions #############################
    
    /** Converts mBar to honda 16 Bit ADC value*/
    map_mbarToADC: function(mBarInput, mBar0v, mBar5v) {
        var value = (mBarInput - mBar0v) / (mBar5v - mBar0v);
        value = value * 4095;
        value = Math.max(0, Math.min(4095, value));
        value = Math.round(value);
        value = value << 4;         // Left shift by 4 to comply with 12 bit ADC format
        return Math.min( 0xfff0, Math.max(0,value) );
    },

    /** Convert 16 Bit ADC to mBar value */
    map_adcToMbar: function(adcValue, mBar0v, mBar5v) {
        var value = parseInt(adcValue, 16);
        value = adcValue >> 4;
        value /= 4095;
        value *= (mBar5v - mBar0v);
        value += mBar0v;
        value = Math.round(value);
        return Math.min(mBar5v, Math.max(mBar0v, value))
    },
    
    /** Convert raw MAP high byte to mBar */
    map_rawHighByteTomBar: function(rawMapHighByte , mbar0v , mbar5v){
        // Convert
        var mBar =  Math.round(rawMapHighByte / 255 *  (mbar5v - mbar0v) + mbar0v)
        
        // Constrain
        return Math.min(mbar5v, Math.max(mbar0v, mBar))
    },

    /** Convert mBar to raw MAP high byte */
    map_mBarToRawHighByte: function(mBar , mbar0v , mbar5v){
        // Convert 
        return Math.round(Math.max(0, Math.min(255, ((mBar - mbar0v) * 255) / (mbar5v - mbar0v))));
    },

    /** Get offset MAP mBar boundaries */
    map_getOffsetMapBoundaries: function(){
        // Get Mbar value for 8 Bit minimum ADC
        var minOffsetMap = this.map_adcToMbar(address.MAP_STOCK_OFFSET_MIN_ADC , address.MAP_STOCK_0V_MBAR , address.MAP_STOCK_5V_MBAR)	

        // Get Mbar value for 8 Bit maximum ADC
        var maxOffsetMap = this.map_adcToMbar(address.MAP_STOCK_OFFSET_MAX_ADC , address.MAP_STOCK_0V_MBAR , address.MAP_STOCK_5V_MBAR)	 
        
        return {min: minOffsetMap, max: maxOffsetMap}
    },

    /** Convert offset MAP byte to mBar */
    map_offsetToMbar: function(offsetMap){
        
        // Get the min and max mBar values for the offset map
        var boundary = this.map_getOffsetMapBoundaries();

        // Convert
        return Math.round(offsetMap / 255 *  (boundary.max - boundary.min) + boundary.min)
    },

    /** Convert mBar to offset MAP byte */
    map_mBarToOffset: function(mBar){
        // Get the min and max mBar values for the offset map
        var boundary = this.map_getOffsetMapBoundaries();
        
        // Convert 
        return Math.round(Math.max(0, Math.min(255, ((mBar - boundary.min) * 255) / (boundary.max - boundary.min))));
    },

    /** Adjust MAP error voltage boundaries. Accepts raw BYTE ONLY or mBar value */
    map_SetDTCBoundaries: function(lowThreshold, highThreshold, convertmBar){

        var lowThresholdByte = lowThreshold;
        var highThresholdByte = highThreshold;

        if(convertmBar){
            // Convert mBar to ADC value, and truncate to high byte only 
            lowThresholdByte = this.map_mbarToADC(lowThreshold, address.MAP_STOCK_0V_MBAR, address.MAP_STOCK_5V_MBAR) >> 8;
            highThresholdByte = this.map_mbarToADC(highThreshold, address.MAP_STOCK_0V_MBAR, address.MAP_STOCK_5V_MBAR) >> 8;
        }


        // Write boundary values to ROM 
        rom.byteAt(address.MAP_LOWER_THRESHOLD_LOC) = this.constrainByte(lowThresholdByte);
        rom.byteAt(address.MAP_UPPER_THRESHOLD_LOC) = this.constrainByte(highThresholdByte);

    },

    /** Convert raw MAP high byte to mBar 
     * If using custom MAP set convertCustom to true and give the scale
     * Otherwise just false
    */
    map_rawHighByteToOffset: function(rawMapHighByte, convertCustom, mbar0v, mbar5v){
        if(convertCustom === undefined) convertCustom = false;
        if(mbar0v === undefined) mbar0v = 0;
        if(mbar5v === undefined) mbar5v = 0;

        var hiByte = rawMapHighByte;
        // Convert from given scale to stock scale
        if(convertCustom == true){
            hiByte = P13.map_customRawByteToStockRawByte(rawMapHighByte, mbar0v, mbar5v);
        }
        // Convert
        var offsetByte = (hiByte - 0x18) << 1;
       
        // Constrain
        if(hiByte > 0x97){
            offsetByte = 0xff;
        }
        if(hiByte < 0x19){
            offsetByte = 0x00
        }
        
        return this.constrainByte(offsetByte);
    },

    /** Convert custom raw high byte to stock raw high byte equivalent */
    map_customRawByteToStockRawByte: function(adcHigh, mbar0v, mbar5v) {
        var adc = adcHigh << 4;
        var oldRange = mbar5v - mbar0v;
        var mbarValue = mbar0v + (adc / 0xFFF) * oldRange;
        var newMbar0v = address.MAP_STOCK_0V_MBAR;
        var newMbar5v = address.MAP_STOCK_5V_MBAR;
        var newRange = newMbar5v - newMbar0v;
        var newAdc12bit = ((mbarValue - newMbar0v) / newRange) * 0xFFF;
        newAdc12bit = Math.max(0, Math.min(0xFFF, newAdc12bit));
        var newAdcHigh = Math.floor(newAdc12bit) >> 4;
        return newAdcHigh;
    },

    //################## RPM Functions #########################

    /** Convert P13 byte RPM */
    rpm_byteToRPM: function(b) {
        var dividend = 240000;
        var divisor = 64;
        var range = Math.floor(b / 0x40);
        if (b == 0xFE) return 7862;
        if (b == 0xFF) return 10054;
        if (b == 0x1) return 514;
        if (b == 0x0) return 0;

        dividend = dividend >> range;
        divisor = divisor - (divisor * range)

        return Math.round(1875000 / (dividend / (b + divisor)));

    },

    /** Convert RPM to P13 byte */
    rpm_RPMToByte: function(rpm) {
        var dividend = 240000;
        var divisor = 64;
        var range = 0;
        if (rpm > 10053) return 0xff;
        if (rpm > 7862) return 0xfe;
        if (rpm == 0) return 0x0;
        if (rpm < 515) return 0x1;
        if (rpm > 1014) range++;
        if (rpm > 2000) range++;
        if (rpm > 4010) range++;

        dividend = dividend >> range;
        divisor = divisor - (divisor * range)

        return Math.floor((dividend / (1875000 / rpm)) - divisor);

    },

    /** Convert word to RPM */
    rpm_wordToRPM: function(w) {
        return Math.round(1875000 / w);
    },

    /** Convert RPM to word, clamped to the word range (0 RPM or less gives the lowest RPM, 0xFFFF) */
    rpm_RPMToWord: function(r) {
        if (r <= 0) return 0xFFFF;
        return Math.max(1, Math.min(0xFFFF, Math.round(1875000 / r)));
    },
    
    //############### ECU Option Functions #####################
    
    /**Disable / enable EGR 
     * @param {boolean} enable - true to enable EGR, false to disable EGR
    */
    opt_toggleEGR: function(enable) {
        // Changes a conditional jump to always jump to "Disable EGR Valve" code.
        // Disables Fuel and ignition EGR adjustments as well. Mimics stock ECU behavior when EGR conditions not met.

        EGR_DISABLE_PATCH_CODE = 0xcb;      // SJ
        EGR_DISABLE_STOCK_CODE = 0xca;      // JLT
        
        // Set bytevalue for patch
        var patchByte = EGR_DISABLE_PATCH_CODE;
        if (enable) {
            patchByte = EGR_DISABLE_STOCK_CODE;
        }

        // Write ROM byte
        rom.byteAt(address.EGR_DISABLE_PATCH_LOC) = patchByte;
        return;
    },
    
    /** Knock Sensor disable 
         * @param {boolean} allow - true to allow knock, false to disable it
    */
    opt_disableKnock: function() {
        var romHandler = rpRomHandler("add");
        var enableBytes = [romHandler.col1EnableValue, romHandler.col2EnableValue, romHandler.col3EnableValue];
        var disableBytes = [romHandler.col1DisableValue, romHandler.col2DisableValue, romHandler.col3DisableValue];

        var knockMap = {byte: 2, bit: 1};
        var byteIndex = knockMap.byte;
        var bitIndex = knockMap.bit;
        enableBytes[byteIndex] &= ~(1 << bitIndex);
        disableBytes[byteIndex] &= ~(1 << bitIndex);
        
        // Write enable and disable bytes to ROM
        rom.byteAt(romHandler.col1EnableLoc)  = enableBytes[0];
        rom.byteAt(romHandler.col1DisableLoc) = disableBytes[0];
        rom.byteAt(romHandler.col2EnableLoc)  = enableBytes[1];
        rom.byteAt(romHandler.col2DisableLoc) = disableBytes[1];
        rom.byteAt(romHandler.col3EnableLoc)  = enableBytes[2];
        rom.byteAt(romHandler.col3DisableLoc) = disableBytes[2];
        
    },

    //############### Default Patches ##########################
    // Checksum / runaway disable and ECU compatibility are on by default. They are applied when a
    // ROM is opened with neither one present (P13.js __P13EventHooks), not by the Options page.

    /** True when both ROM checksum checks are patched out */
    opt_isChecksumDisabled: function() {
        // Forces conditional jumps at both checksum locations
        var CHECKSUM1_PATCH_LOC = 0x0d26;
        var CHECKSUM2_PATCH_LOC = 0x09db;
        var CHECKSUM_STOCK_CODE = 0xc9;
        return rom.byteAt(CHECKSUM1_PATCH_LOC) != CHECKSUM_STOCK_CODE && rom.byteAt(CHECKSUM2_PATCH_LOC) != CHECKSUM_STOCK_CODE;
    },

    /** Disable (true) or restore (false) both ROM checksum checks and the runaway code check
     *  When features are added to the ROM, the runaway check causes high RPM resets if left alone */
    opt_setChecksumDisabled: function(disable) {
        var CHECKSUM1_PATCH_LOC = 0x0d26;
        var CHECKSUM2_PATCH_LOC = 0x09db;
        var CHECKSUM_PATCH_CODE = 0xcb;
        var CHECKSUM_STOCK_CODE = 0xc9;
        var RUNAWAY_CODE_PATCH_LOC = 0x3951;
        var RUNAWAY_CODE_STOCK_CODE = 0xCD; // Conditional Jump over fail code
        var RUNAWAY_CODE_PATCH_CODE = 0xCB; // Unconditional Jump over fail code

        rom.byteAt(CHECKSUM1_PATCH_LOC) = disable ? CHECKSUM_PATCH_CODE : CHECKSUM_STOCK_CODE;
        rom.byteAt(CHECKSUM2_PATCH_LOC) = disable ? CHECKSUM_PATCH_CODE : CHECKSUM_STOCK_CODE;
        rom.byteAt(RUNAWAY_CODE_PATCH_LOC) = disable ? RUNAWAY_CODE_PATCH_CODE : RUNAWAY_CODE_STOCK_CODE;
    },

    /** True when the ECU compatibility RP jumper index table is installed */
    opt_isECUCompatibilityOn: function() {
        var RP_JUMPER_INDEX_TABLE_LOC = 0x6d56;
        return rom.byteAt(RP_JUMPER_INDEX_TABLE_LOC) != 0xFF;
    },

    /** ECU Compatibility on (true) or restore stock US P13 (false)
     * Allows the p13 rom to be run on other ECUS
     * Merges the RP jumper index table with the indexes from other ROMS such as
     * P11, p12, p14, p39 AND P51
     *
     * It's worth noting that the reason you can't move a stock ROM from a
     * P13 to a P12 (for example) is because the RP jumpers will look up an
     * invalid value from tbl_6d56, telling the ECU that there is a
     * ROM / Hardware mismatch and throw a BRK code and stay in a reset
     * loop (limp mode). The compatibility patch on the Options page actually
     * just populates this table with known indices in the expected locations,
     * allowing the ROM to be run on all the known (to me) ECUs that run the
     * same code base. */
    opt_setECUCompatibility: function(enable) {
        var RP_JUMPER_INDEX_TABLE_LOC = 0x6d56;
        var RP_JUMPER_INDEX_USP13_OFFSET = 17;
        var RP_JUMPER_INDEX_USP13_VALUES = new Array(0x12, 0x13);
        var RP_JUMPER_INDEX_MERGED_TBL = new Array(
            0x02, 0x03, 0xFF, 0x06, 0x05,
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
            0x0F, 0xFF, 0xFF, 0xFF, 0x10,
            0xFF, 0xFF, 0x12, 0x13, 0x01,
            0x07, 0x08, 0x09, 0xFF, 0x0B
        );
        if (enable) {
            this.rom_write(RP_JUMPER_INDEX_TABLE_LOC, RP_JUMPER_INDEX_MERGED_TBL, RP_JUMPER_INDEX_MERGED_TBL.length);
            return;
        }
        // Restore table to stock US p13
        this.rom_fill(RP_JUMPER_INDEX_TABLE_LOC, RP_JUMPER_INDEX_TABLE_LOC + RP_JUMPER_INDEX_MERGED_TBL.length - 1, 0xff);
        this.rom_write(RP_JUMPER_INDEX_TABLE_LOC + RP_JUMPER_INDEX_USP13_OFFSET, RP_JUMPER_INDEX_USP13_VALUES, RP_JUMPER_INDEX_USP13_VALUES.length);
    },

    /** On ROM open: when neither default patch is present, apply both and tell the user */
    applyDefaultPatchesOnOpen: function() {
        if (this.opt_isChecksumDisabled() || this.opt_isECUCompatibilityOn()) return;
        rom.gup();          // begin group undo
        this.opt_setChecksumDisabled(true);
        this.opt_setECUCompatibility(true);
        rom.gup();          // end group undo
        alert("This ROM did not have the checksum / runaway check disable or the ECU compatibility patch.\n\n" +
            "Both have been enabled. They can be turned off in the Options menu.");
    },

    //############### Misc Functions #############################

showVersion: function() {
    include('handlers\\P13_Options\\OptionsPage.js');                      // P13 Options page JS
    include('handlers\\P13_Options\\ECUFeatures.js');                      // ECU Features page JS
    var msg = "";

    msg += "P13_HANDLER_VERSION: " + (typeof P13_HANDLER_VERSION != "undefined" ? P13_HANDLER_VERSION : "n/a") + "\n";
    msg += "P13_OPTIONS_VERSION: " + (typeof P13_OPTIONS_VERSION != "undefined" ? P13_OPTIONS_VERSION : "n/a") + "\n";
    msg += "P13_HELPER_VERSION: " + (typeof P13_HELPER_VERSION != "undefined" ? P13_HELPER_VERSION : "n/a") + "\n";
    msg += "P13_ADDRESSES_VERSION: " + (typeof P13_ADDRESSES_VERSION != "undefined" ? P13_ADDRESSES_VERSION : "n/a") + "\n";
    msg += "P13_DATLOGGER_VERSION: " + (typeof P13_DATLOGGER_VERSION != "undefined" ? P13_DATLOGGER_VERSION : "n/a") + "\n";
    msg += "P13_BOOST_HANDLER_VERSION: " + (typeof P13_BOOST_HANDLER_VERSION != "undefined" ? P13_BOOST_HANDLER_VERSION : "n/a") + "\n";
    msg += "ECU_FEATURES_VERSION: " + (typeof ECU_FEATURES_VERSION != "undefined" ? ECU_FEATURES_VERSION : "n/a");

    alert(msg);
},
    
    /**Get custom multiplier value if applicable. Return 0x200 for no change multiplier */
    getCustomXplierValue: function() {

        var PATCHED_VALUE = 0x02cb;

        //No patch, return stock multiplier
        if (rom.wordAt(address.RP7_FUEL_XPLIER_PATCH2_LOC) != PATCHED_VALUE) {
            return 0x200;
        }

        //ROM is patched. Get multiplier
        return  (rom.byteAt(address.RP7_FUEL_XPLIER_MSB_LOC) << 8) + rom.byteAt(address.RP7_FUEL_XPLIER_LSB_LOC);

    },

    applyTrimValue: function(fuelBase , customXplier , xplierBase){
        return (fuelBase * customXplier) / xplierBase;
    },

    /**Get fuel and ignition table width / height */
    getTableSize: function(){
        var tableSize = {width: 0, height: 0};
        
        tableSize.width = rom.byteAt(address.TABLE_WIDTH_LOC_1);
        tableSize.height = rom.byteAt(address.TABLE_HEIGHT_LOC_2) + 2;
        return tableSize;
    },
    
    /**Create an array from a given table 
     * @param {number} address - Table address in ROM 
     * @param {number} width - Table width
     * @param {number} height - Table height
     * @returns {number[][]} array[row][col]
    */
    CreateArrayFromTable: function(address, width, height){
        var tableArray = [];

        for(var row = 0; row < height; row++){
            tableArray[row] = [];
            for(var col = 0; col < width; col++){
                tableArray[row][col] = rom.byteAt(address + (col + (row * width)));
            }
        }
        return tableArray;  
    },

    /**Write a fixed size table to ROM from an array. Duplicating the final col for each row when going larger than array, and
     * truncating col data when going smaller  
     * Returns last memory address written*/
    WriteArrayToROMTable: function(address, newWidth, newHeight, tableArray) {
        var arrayWidth = tableArray[0].length; // Detect table width
        var arrayHeight = tableArray.length; // Detect table height
        var memoryAddress = 0;

        for (var row = 0; row < newHeight; row++) {
            for (var col = 0; col < newWidth; col++) {
                var value;

                // If the current row/column is within the bounds of the original table
                if (row < arrayHeight && col < arrayWidth) {
                    value = tableArray[row][col];
                } else if (row < arrayHeight) {
                    // Extend columns by repeating the last column of the current row
                    value = tableArray[row][arrayWidth - 1];
                } else {
                    // Extend rows by repeating the last row (also extend columns)
                    var lastRow = tableArray[arrayHeight - 1];
                    value = (col < arrayWidth) ? lastRow[col] : lastRow[arrayWidth - 1];
                }

                // Calculate the memory address
                memoryAddress = address + (col + (row * newWidth));

                // Write the value from tableArray to the memory
                rom.byteAt(memoryAddress) = value;
            }
        }
        return memoryAddress;
    },

    /** Fill ROM with single value */
    rom_fill: function(fromAdr, toAdr, byteFill) {
        if (byteFill == null) byteFill = 0x00;
        for (var i = fromAdr; i <= toAdr; i++) {
            rom.byteAt(i) = byteFill;
        }
    },

    /** Write array to ROM */
    rom_write: function(startAt, v, count) {
        for (var c = 0; c < count; c++) {
            rom.byteAt(startAt + c) = v[c];
        }
    },

    /** Constrain to byte value */
    constrainByte: function (value){
        return Math.max(Math.min(value, 0xff), 0x00);
    },
    /** Split address to bytes 
     * @param {number}address - 16 Bit address to split
     * @returns {number[]} array[msb , lsb]
    */
    addressToBytes: function (address){
        addresss = address & 0xFFFF;
        var bytes = [
            (address >> 8) & 0xFF,
            address & 0xFF
        ];
        return bytes;
    },
    test: function() {
        alert('P13 Helper Test');
    }


}
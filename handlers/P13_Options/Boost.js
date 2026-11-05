/*********************************************************************
 * P13 Boost Handler for CROME
 * Auth: Awon (BiggieSmallBlock on pgmfi)
 ********************************************************************
 This handler will:
 - Add boost columns to the main fuel and ignition tables
 - Change the MAP scalars to use RAW MAP instead of offset MAP
 - Remove the EGR tables that are in the way, and disable EGR
 - Update the MAP DTC thresholds to allow for boost values
 - Bypass the Max allowable fuel table values when boosted
 - Update the ignition safegaurds to allow boosted MAP values
 - Disable knock sensor.

 Notes: EGR and Knock are disabled because they use the same lookup function 
 and width as the main fuel and ignition tables. They could be made compatible, 
 but it wasn't worth the effort.  The EGR tables were also in the way of 
 where the expanded fuel and ignition tables wanted to be.

 Changelog:
    -v1.0   - Initial working release - March 2026
 */ 

 var P13_BOOST_HANDLER_VERSION = "1.0";

/// <reference path="./P13Addresses.js" />

// Default mBar values for 6 new boost columns
var MAP_DEFAULT_BOOST_COL_MBAR = [1161 , 1284 , 1407 , 1529 ,1652 , 1787];

var CUSTOM_MAP_RANGE_NOT_BOOST_READY = "This MAP sensor range can't be used with boost columns. " +
    "The sensor must read about 104 mBar or lower at 0V, and about 1035 mBar or higher at 5V.";

/** Used to expand the fuel and igntion tables, and custom map sensor */
function P13BoostHandler(){
    
    // Check to see if already installed
    if(rom.byteAt(address.TABLES_USING_STANDARD_SIZE) == 0x00){
        alert("It appears that this ROM already has this installed.");
        return;
    }
    
    var yesBoost = confirm(
        "This will add boost columns to the ROM's tables." + 
        "\nEGR and Knock will be disabled and removed from the ROM." + 
        "\nWould you like to continue?"
    );
    if (yesBoost){
        // Check the sensor range first, so a refused install writes nothing
        var sensorMbar0V = address.MAP_STOCK_0V_MBAR;
        var sensorMbar5V = address.MAP_STOCK_5V_MBAR;
        if(rom.byteAt(mapSensor.USING_STOCK_MAP_SENSOR_LOC) === 0x00){
            sensorMbar0V = rom.wordAt(mapSensor.CUSTOM_MAP_NFO_MIN) - address.MAP_SENSOR_INFO_BIAS;
            sensorMbar5V = rom.wordAt(mapSensor.CUSTOM_MAP_NFO_MAX) - address.MAP_SENSOR_INFO_BIAS;
        }
        if(__offsetToAxisRawConstants(sensorMbar0V, sensorMbar5V) === null){
            alert(CUSTOM_MAP_RANGE_NOT_BOOST_READY + "\nNo changes have been made to the ROM.");
            return;
        }
        rom.gup();
        var newTableWidth = 16;
        var stockMinmBarThreshold = 10;
        __ExpandMainTables();                                                       // Expand tables, make some rom updates
        __UpdateRomTableWidth(newTableWidth);                                       // Update ROM table dimensions and refresh
        P13.map_SetDTCBoundaries(stockMinmBarThreshold, address.MAP_STOCK_5V_MBAR, true);// Change MAP DTC boundaries to allow boosted values
        address.Refresh();                                                          // Update CROME addresses from ROM and refresh
        __updateMapScalars();                                                       // Add boost scalars then convert MAP scalars to use RAW adc high byte
        address.Refresh();                                                          // Update CROME addresses from ROM and refresh
        __addRawMapPatches(sensorMbar0V, sensorMbar5V);                             // Add ROM code to use raw MAP for column and fractional column
        __addFuelBoundarySkip();                                                    // Add ROM code to skip the fuel table Max value check during boost
        rom.byteAt(address.TABLES_USING_STANDARD_SIZE) = 0x00;                      // Set flag to show that we are not using standard size tables
        P13.opt_toggleEGR(false);                                                   // Disable EGR 
        P13.opt_disableKnock();                                                     // Disable Knock
        rom.hasBoost = 1;                                                           // Inform CROME that ROM is boosted
        rom.gup();
        alert("Boost columns have been added.\nEGR / Knock have been removed. \nIf CROME panics and doesn't color in all the cells. Save the ROM and re-open it to correct.");
        address.Refresh();                                                          // Update CROME addresses from ROM and refresh
    }
    else{
        alert("No changes have been made to the ROM.");
    }


}

/**Expands 4 Main fuel and ignition tables to 16x20, updates ROM references, and scalar table and 00 free space created 
 * @NOTE: MUST BE USED WITH EGR DISABLE AS EGR TABLES ARE REMOVED
*/
function __ExpandMainTables(){
    var boostFuelPerColumnMultipler = 8.0;
    var boostIgnitionPerColumnMultiplier = -5.0;
    
    // ROM table reference locations (pointer locations)
    var IGNITION_FAULT_TABLE_REF = 0x22ce;
    var DEAD_EGR_TABLE_1_REF = 0x2b94;
    var DEAD_EGR_TABLE_2_REF = 0x2b9a;
    var DEAD_EGR_TABLE_3_REF = 0x2bac;
    var DEAD_EGR_TABLE_4_REF = 0x2bb2;
    var DEAD_EGR_TABLE_5_REF = 0x2318;
    var DEAD_EGR_TABLE_6_REF = 0x231e;
    var DEAD_EGR_TABLE_7_REF = 0x233b;
    var DEAD_EGR_TABLE_8_REF = 0x2341;
    var DEAD_EGR_TABLE_9_REF = 0x3523;
    var DEAD_EGR_TABLE_10_REF = 0x3529;
    var DEAD_EGR_TABLE_11_REF = 0x353b;
    var DEAD_EGR_TABLE_12_REF = 0x3541;    
    
    // ROM locations
    var IGNITION_FAULT_TABLE_LOC = 0x63f2;          // Relocated table
    var DESIGNATED_TABLE_AREA_START = 0x60aa;       // Beginning of area used for new tables
    var DESIGNATED_TABLE_AREA_END = 0x6901;         // End of area to use for new tables
    
    // EGR tables removed during the process
    var DEAD_EGR_TABLE_1_LOC = 0x623a;
    var DEAD_EGR_TABLE_2_LOC = 0x62a8;
    var DEAD_EGR_TABLE_3_LOC = 0x6316;
    var DEAD_EGR_TABLE_4_LOC = 0x6384;
    var DEAD_EGR_TABLE_5_LOC = 0x64c0;
    var DEAD_EGR_TABLE_6_LOC = 0x652e;
    var DEAD_EGR_TABLE_7_LOC = 0x6664;
    var DEAD_EGR_TABLE_8_LOC = 0x66d2;
    var DEAD_EGR_TABLE_9_LOC = 0x6740;
    var DEAD_EGR_TABLE_10_LOC = 0x67ae;
    var DEAD_EGR_TABLE_11_LOC = 0x681c;
    var DEAD_EGR_TABLE_12_LOC = 0x688a;
    
    var NEW_TABLE_WIDTH = 16;
    
    // Backup existing tables
    var tableSize = P13.getTableSize();
    var lowFuelTable = P13.CreateArrayFromTable(rom.addressOf('LOW_FUEL'), tableSize.width, tableSize.height);
    var hiFuelTable = P13.CreateArrayFromTable(rom.addressOf('HIGH_FUEL'), tableSize.width, tableSize.height);
    var lowIgnitionTable = P13.CreateArrayFromTable(rom.addressOf('LOW_IGNITION'), tableSize.width, tableSize.height);
    var hiIgnitionTable = P13.CreateArrayFromTable(rom.addressOf('HIGH_IGNITION'), tableSize.width, tableSize.height);
    var ignFaultTable = P13.CreateArrayFromTable(IGNITION_FAULT_TABLE_LOC, 6, 1);
    var offsetMapScalarTable = P13.CreateArrayFromTable(rom.addressOf('LOW_MAP_SCALAR'), tableSize.width, 1);

    
    // 00 designated table area
    P13.rom_fill(DESIGNATED_TABLE_AREA_START, DESIGNATED_TABLE_AREA_END, 0x00);
    
    // 00 old map scalar area
    P13.rom_fill(rom.addressOf('LOW_MAP_SCALAR'), rom.addressOf('LOW_MAP_SCALAR') + offsetMapScalarTable[0].length - 1, 0x00);
    
    // Write resized tables to ROM
    var ignFaultTblLoc = DESIGNATED_TABLE_AREA_START;
    var ignFaultEndLoc = P13.WriteArrayToROMTable(ignFaultTblLoc , ignFaultTable[0].length, ignFaultTable.length, ignFaultTable);
    var mapScalarNewLoc = ignFaultEndLoc + 1;
    var mapScalarEndLoc = P13.WriteArrayToROMTable(mapScalarNewLoc, NEW_TABLE_WIDTH, 1, offsetMapScalarTable);
    var lowFuelNewLoc = mapScalarEndLoc + 1;
    var lowFuelEndLoc = __writeArrayToROMTableWboostFuel(lowFuelNewLoc, NEW_TABLE_WIDTH, tableSize.height, lowFuelTable, boostFuelPerColumnMultipler, true);
    var hiFuelNewLoc = lowFuelEndLoc + 1;
    var hiFuelEndLoc = __writeArrayToROMTableWboostFuel(hiFuelNewLoc, NEW_TABLE_WIDTH, tableSize.height, hiFuelTable, boostFuelPerColumnMultipler, true);
    var lowIgnNewLoc =  hiFuelEndLoc + 1;
    var lowIgnEndLoc = __writeArrayToROMTableWboostFuel(lowIgnNewLoc, NEW_TABLE_WIDTH, tableSize.height, lowIgnitionTable, boostIgnitionPerColumnMultiplier, false);
    var hiIgnNewLoc = lowIgnEndLoc + 1;
    var hiIgnEndLoc = __writeArrayToROMTableWboostFuel(hiIgnNewLoc, NEW_TABLE_WIDTH, tableSize.height, hiIgnitionTable, boostIgnitionPerColumnMultiplier, false);
    var newFreeSpace = hiIgnEndLoc + 1;

    // Update ROM references to tables
    rom.wordAt(address.LOW_FUEL_REF) = lowFuelNewLoc;
    rom.wordAt(address.HIGH_FUEL_REF) = hiFuelNewLoc;
    rom.wordAt(address.LOW_IGNITION_REF) = lowIgnNewLoc;
    rom.wordAt(address.HIGH_IGNITION_REF) = hiIgnNewLoc;
    rom.wordAt(IGNITION_FAULT_TABLE_REF) = ignFaultTblLoc;
    rom.wordAt(address.MAP_SCALAR_REF) = mapScalarNewLoc;
    
    // Re direct dead EGR table refs to new free space
    rom.wordAt(DEAD_EGR_TABLE_1_REF) = newFreeSpace;
    rom.wordAt(DEAD_EGR_TABLE_2_REF) = newFreeSpace;
    rom.wordAt(DEAD_EGR_TABLE_3_REF) = newFreeSpace;
    rom.wordAt(DEAD_EGR_TABLE_4_REF) = newFreeSpace;
    rom.wordAt(DEAD_EGR_TABLE_5_REF) = newFreeSpace;
    rom.wordAt(DEAD_EGR_TABLE_6_REF) = newFreeSpace;
    rom.wordAt(DEAD_EGR_TABLE_7_REF) = newFreeSpace;
    rom.wordAt(DEAD_EGR_TABLE_8_REF) = newFreeSpace;
    rom.wordAt(DEAD_EGR_TABLE_9_REF) = newFreeSpace;
    rom.wordAt(DEAD_EGR_TABLE_10_REF) = newFreeSpace;
    rom.wordAt(DEAD_EGR_TABLE_11_REF) = newFreeSpace;
    rom.wordAt(DEAD_EGR_TABLE_12_REF) = newFreeSpace;

    // Update flag to show that table resize is in progress
    rom.byteAt(address.TABLES_USING_STANDARD_SIZE) = 0xf0;
}

/** Update ROM table dimension values */
function __UpdateRomTableWidth(width){
    // Update ROM Table size in table lookup and column function
    rom.byteAt(address.TABLE_WIDTH_LOC_1) = width;                // Table lookup dimension
    rom.byteAt(address.TABLE_WIDTH_LOC_2) = width;                // Table lookup dimension
    rom.byteAt(address.TABLE_WIDTH_LOC_3) = width - 2;            // MAP Column dimension
    rom.byteAt(address.TABLE_WIDTH_LOC_4) = width - 2;            // MAP Column dimension
}

/** Update MAP scalars , to RAW and populate boost scalar values when needed */
function __updateMapScalars(){
    var mapScalarTableLoc = rom.addressOf('LOW_MAP_SCALAR');
    var rawMbar0v = rom.addressOf('NFO_MAP_MIN') - 0x8000;
    var rawMbar5v = rom.addressOf('NFO_MAP_MAX') - 0x8000;
    var firstTimeExpanding = false;
    
    // First time expanding tables?
    if(rom.byteAt(address.TABLES_USING_STANDARD_SIZE) === 0xf0){firstTimeExpanding = true;}
   
    // Get MAP scalar table
    var tableSize = P13.getTableSize();
    var mapScalarTable = P13.CreateArrayFromTable(mapScalarTableLoc, tableSize.width, 1);
    var mbarScalarTable = mapScalarTable;
    var stockRawScalars = [];       // Exact raw bytes for stock-sensor offset columns, first time only
    var i;


    // First Time? Convert from offset to mBar
    if(firstTimeExpanding){
        for (i = 0; i < tableSize.width && i < mapScalarTable[0].length; i++) {
            // Stock sensor: convert the offset straight to the raw high byte that
            // P13.map_rawHighByteToOffset maps back to the same offset (offset 2k <- raw 0x18 + k;
            // 0xFF <- first byte above 0x97). Going through mBar turned offset 0xFF into raw 0x97 (offset 0xFE).
            if (rom.byteAt(mapSensor.USING_STOCK_MAP_SENSOR_LOC) == 0xff) {
                var offset = mapScalarTable[0][i];
                stockRawScalars[i] = (offset >= 0xFF) ? 0x98 : 0x18 + Math.ceil(offset / 2);
            }
            mbarScalarTable[0][i] = P13.map_offsetToMbar(mapScalarTable[0][i]);
        }
        // Populate boost columns with default values
        for (i = 0; i < MAP_DEFAULT_BOOST_COL_MBAR.length; i++) {
            mbarScalarTable[0][10 + i] = MAP_DEFAULT_BOOST_COL_MBAR[i];
            stockRawScalars[10 + i] = undefined;    // Boost columns are mBar values, not stock offsets
        }
    }
    else{
        // Convert raw MAP scalars to mBar
        for (i = 0; i < tableSize.width && i < mapScalarTable[0].length; i++) {
            mbarScalarTable[0][i] = P13.map_rawHighByteTomBar(mapScalarTable[0][i], rawMbar0v, rawMbar5v );
        }  
    }
 
    //  Get updated custom MAP sensor info.
    if(rom.byteAt(mapSensor.USING_STOCK_MAP_SENSOR_LOC) != 0xff){
        rawMbar0v = rom.wordAt(mapSensor.CUSTOM_MAP_NFO_MIN) - 0x8000;
        rawMbar5v = rom.wordAt(mapSensor.CUSTOM_MAP_NFO_MAX) - 0x8000;
    }

    // Convert mBar scalars to raw ADC high byte
    for (i = 0; i < mbarScalarTable[0].length; i++) {
        mapScalarTable[0][i] = P13.constrainByte(P13.map_mBarToRawHighByte(mbarScalarTable[0][i], rawMbar0v, rawMbar5v));
        if (stockRawScalars[i] !== undefined) mapScalarTable[0][i] = stockRawScalars[i];
    }

    // Write tables to ROM 
    P13.WriteArrayToROMTable(mapScalarTableLoc, tableSize.width, 1, mapScalarTable);

    // Set ROM flag to use raw scalars
    rom.byteAt(address.MAP_USING_OFFSET_SCALARS_LOC) = 0x00;
}

/** Add ROM code to create a new column and fractional column for raw MAP */
function __addRawMapPatches(mbar0V, mbar5V) {
    /** Update ROM to use raw MAP for column calcs.
     *
     * The boosted axis scalars are raw MAP high bytes, but BARO and the fault value for MAP only
     * exist in the ROM as offset bytes. CP-028: while MAP has a fault, both columns must use a
     * value that means the same pressure as the axis, on whichever sensor is fitted.
     * The offset bytes are always on the stock scale because the custom MAP handler converts to it,
     * while raw MAP is on the fitted sensor's scale. So they are converted at the point of use. */

    var FUEL_COLUMN_MAP_HOOK_LOC = 0x2207;
    var IGNITION_COLUMN_MAP_PARAMETER_LOC = 0x2098;
    var IGNITION_COLUMN_BARO_HOOK_LOC = 0x208d;
    var IGNITION_COLUMN_STORE_LOC = 0x209a;             // label_209a: stores the column input
    var IGNITION_COLUMN_NEXT_CHECK_LOC = 0x2092;        // label_2092: stock checks after the first fault bit

    // 66207 opcodes used by the patches below
    var LB_A_ZERO_PAGE = 0xF5;
    var LB_A_OFF = 0xF4;
    var STB_A_ZERO_PAGE = 0xD5;
    var STB_A_R0 = 0x88;
    var MOVB_R0_IMMEDIATE = 0x98;
    var MULB_PREFIX = 0xA2;
    var MULB_OPERATION = 0x34;
    var ADDB_A_IMMEDIATE = 0x86;
    var JBR_BIT_BASE = 0xD8;                            // JBR off(xx).n is JBR_BIT_BASE + n
    var JBS_BIT_BASE = 0xE8;                            // JBS off(xx).n is JBS_BIT_BASE + n
    var J_ABSOLUTE = 0x03;
    var CAL_ABSOLUTE = 0x32;
    var RT = 0x01;
    var NOP = 0x00;

    var ERROR_FLAGS_OFF = address.RAM_ERROR_FLAGS & 0xff;   // off() operand: low byte of the RAM address
    var MAP_OFFSET_OFF = address.RAM_MAP_OFFSET & 0xff;
    var J_LENGTH = 3;                                   // Bytes in J_ABSOLUTE and its address
    var LB_OFF_LENGTH = 2;                              // Bytes in LB A, off(xx)
    var CAL_LENGTH = 3;                                 // Bytes in CAL_ABSOLUTE and its address

    var baroColumnLoc = address.RAW_BARO_COLUMN_PATCH_LOC;
    var fuelColumnLoc = address.RAW_FUEL_COLUMN_PATCH_LOC;
    var helperLoc = address.OFFSET_TO_AXIS_RAW_FUNC_LOC;
    var baroColumnBytes = P13.addressToBytes(baroColumnLoc);
    var fuelColumnBytes = P13.addressToBytes(fuelColumnLoc);
    var helperBytes = P13.addressToBytes(helperLoc);
    var storeBytes = P13.addressToBytes(IGNITION_COLUMN_STORE_LOC);
    var nextCheckBytes = P13.addressToBytes(IGNITION_COLUMN_NEXT_CHECK_LOC);

    // OLD: LB A, 0e0h; JBS off(00210h).2, label_209a
    // NEW: J  baroColumn; NOP; NOP;
    var hook = [J_ABSOLUTE, baroColumnBytes[1], baroColumnBytes[0], NOP, NOP];

    /** Ignition column fallback. The result in A is only used while MAP has a fault: with no fault
     *  the stock code goes on to IGNITION_COLUMN_MAP_PARAMETER_LOC and loads raw MAP instead.
     *
     * baroColumn:      LB      A, 0e0h                 ; BARO as an offset byte (stock scale)
     *                  CAL     offsetToAxisRaw         ; Convert to the scale of the raw MAP axis
     *                  JBR     off(00210h).2, bc_return; Stock code flow overwritten by hook
     *                  J       label_209a
     * bc_return:       J       label_2092 */
    var baroCustomPatch = [
        LB_A_ZERO_PAGE, address.RAM_BARO_OFFSET,
        CAL_ABSOLUTE, helperBytes[1], helperBytes[0],
        JBR_BIT_BASE + address.RAM_ERROR_CODE_3_BIT, ERROR_FLAGS_OFF, J_LENGTH,
        J_ABSOLUTE, storeBytes[1], storeBytes[0],
        J_ABSOLUTE, nextCheckBytes[1], nextCheckBytes[0]
    ];

    // Write BARO column patch
    P13.rom_write(baroColumnLoc, baroCustomPatch, baroCustomPatch.length);

    // Write BARO hook
    P13.rom_write(IGNITION_COLUMN_BARO_HOOK_LOC, hook, hook.length)

    /** Fuel column. Raw MAP normally. With a MAP fault raw MAP is the failed reading, so use the
     *  value the stock ROM substitutes for it at 00288h (derived from TPS), converted to the axis scale.
     *
     * fuelMapPatch:    STB     A, 0e3h                 ; Stock code that hook overwrote
     *                  LB      A, 0a5h                 ; Get MAP High byte
     *                  JBS     off(00210h).2, fm_fault ; Code 3?
     *                  JBR     off(00210h).4, fm_store ; Not code 5 either: keep raw MAP
     * fm_fault:        LB      A, off(00288h)          ; Value the ROM substitutes during a MAP fault
     *                  CAL     offsetToAxisRaw         ; Convert to the scale of the raw MAP axis
     * fm_store:        STB     A, r0                   ; Stock code that hook overwrote
     *                  RT */
    var fuelMapCustomPatch = [
        STB_A_ZERO_PAGE, address.RAM_FUEL_COLUMN_MAP,
        LB_A_ZERO_PAGE, address.RAM_MAP_RAW_HIGH_BYTE,
        JBS_BIT_BASE + address.RAM_ERROR_CODE_3_BIT, ERROR_FLAGS_OFF, J_LENGTH,
        JBR_BIT_BASE + address.RAM_ERROR_CODE_5_BIT, ERROR_FLAGS_OFF, LB_OFF_LENGTH + CAL_LENGTH,
        LB_A_OFF, MAP_OFFSET_OFF,
        CAL_ABSOLUTE, helperBytes[1], helperBytes[0],
        STB_A_R0,
        RT
    ];

    // Write fuel MAP parameter patch code
    P13.rom_write(fuelColumnLoc, fuelMapCustomPatch, fuelMapCustomPatch.length);

    // Write fuel MAP parameter hook
    P13.rom_write(FUEL_COLUMN_MAP_HOOK_LOC, [CAL_ABSOLUTE, fuelColumnBytes[1], fuelColumnBytes[0]], CAL_LENGTH);

    /** Convert an offset MAP / BARO byte in A to the raw axis scale. Overwrites r0.
     *  The multiplier and addend are placeholders here, set by __writeOffsetToAxisRawConstants.
     *
     * offsetToAxisRaw: MOVB    r0, #MULTIPLIER
     *                  MULB                            ; ACC = A * r0
     *                  LB      A, ACCH                 ; (A * MULTIPLIER) >> 8
     *                  ADDB    A, #ADDEND
     *                  RT */
    var offsetToAxisRawCode = [
        MOVB_R0_IMMEDIATE, 0x00,
        MULB_PREFIX, MULB_OPERATION,
        LB_A_ZERO_PAGE, address.RAM_ACC_HIGH_BYTE,
        ADDB_A_IMMEDIATE, 0x00,
        RT
    ];
    P13.rom_write(helperLoc, offsetToAxisRawCode, offsetToAxisRawCode.length);
    __writeOffsetToAxisRawConstants(mbar0V, mbar5V);

    // Patch Ignition column parameter
    // OLD: LB A, off(00288h)   NEW: LB A, 0a5h
    P13.rom_write(IGNITION_COLUMN_MAP_PARAMETER_LOC, [LB_A_ZERO_PAGE, address.RAM_MAP_RAW_HIGH_BYTE], 2)


}

/** Multiplier and addend for the code at OFFSET_TO_AXIS_RAW_FUNC_LOC.
 *  An offset byte is on the stock sensor's scale whichever sensor is fitted, and the result must be
 *  a raw high byte on the fitted sensor's scale. Returns null if that range cannot be represented:
 *  0v above the offset scale's start, a range too narrow for the multiplier, or a result past 0xFF. */
function __offsetToAxisRawConstants(mbar0V, mbar5V){
    var stockSpan = address.MAP_STOCK_5V_MBAR - address.MAP_STOCK_0V_MBAR;
    var span = mbar5V - mbar0V;
    var mbarAtOffsetZero = address.MAP_STOCK_0V_MBAR + stockSpan * address.MAP_OFFSET_ZERO_ADC / address.MAP_ADC_FULL_SCALE;
    var multiplier = Math.round(address.MAP_OFFSET_ADC_PER_BYTE * stockSpan / span);
    var addend = Math.round((mbarAtOffsetZero - mbar0V) * address.MAP_RAW_HIGH_BYTE_STEPS / span);
    if (addend < 0 || multiplier > 0xff || addend + ((0xff * multiplier) >> 8) > 0xff) return null;
    return {multiplier: multiplier, addend: addend};
}

/** Write the constants for the given sensor range. The range must already have been checked. */
function __writeOffsetToAxisRawConstants(mbar0V, mbar5V){
    var constants = __offsetToAxisRawConstants(mbar0V, mbar5V);
    rom.byteAt(offsetToAxisRaw.MULTIPLIER_LOC) = constants.multiplier;
    rom.byteAt(offsetToAxisRaw.ADDEND_LOC) = constants.addend;
}

/** True if this ROM has the conversion code. ROMs boosted before CP-028 do not, and keep their old fallback. */
function __hasOffsetToAxisRaw(){
    return rom.byteAt(address.OFFSET_TO_AXIS_RAW_FUNC_LOC) !== 0xff;
}

/** Add patch code to ROM to skip Fuel Table Max threshold check when boosted */
function __addFuelBoundarySkip() { 

    // This patch skips the upper boundary check when offset map is 0xff
	// Write hook to patched code
    var patchLoc = P13.addressToBytes(address.FUEL_BOUNDARY_SKIP_ON_BOOST_PATCH_LOC);
    var hook = [0x03 , patchLoc[1] , patchLoc[0] , 0x00 ];
    var hookReturn = P13.addressToBytes(address.FUEL_BOUNDARY_SKIP_ON_BOOST_HOOK_LOC + 4);
    P13.rom_write(address.FUEL_BOUNDARY_SKIP_ON_BOOST_HOOK_LOC , hook , hook.length);

	// Write patched code
    var patch = [
        0xC4, 0x78, 0xC0, P13.constrainByte(address.ALLOW_BOOST_FUEL_OFFSET_MAP_THRESHOLD), 0xCA, 0x03, 0x03, 0xB4,
		0x2D, 0x90, 0x9C, 0x21, 0x69, 0x03, hookReturn[1] , hookReturn[0]
    ];
    P13.rom_write(address.FUEL_BOUNDARY_SKIP_ON_BOOST_PATCH_LOC, patch , patch.length);	
    
}

/** Write array to a ROM table. Has the option to increase / decrease boost cols by x% per column */
function __writeArrayToROMTableWboostFuel(address, newWidth, newHeight, tableArray, boostPercentPerColumn, isFuel) {

    var arrayWidth  = tableArray[0].length;   // Detect table width
    var arrayHeight = tableArray.length;       // Detect table height
    var memoryAddress = 0;
    // Boost fuel growth factor (e.g. 50% = 1.5x per boost column)
    var boostFactor = 1 + (boostPercentPerColumn / 100);
    for (var row = 0; row < newHeight; row++) {
        for (var col = 0; col < newWidth; col++) {
            var value;
            // If the current row/column is within the bounds of the original table
            if (row < arrayHeight && col < arrayWidth) {
                // Original table value (standard columns)
                // ECU shifts these values right by 1 (>> 1)
                value = tableArray[row][col];
            }
            else if (row < arrayHeight) {
                // Extend columns beyond the original width (boost columns)
                // Base value is the last standard column of this row
                var base = tableArray[row][arrayWidth - 1];
                // 1-based boost column index
                var boostColIndex = col - (arrayWidth - 1);
                // Apply compound fuel increase
                value = Math.round(base * Math.pow(boostFactor, boostColIndex));
                value = Math.floor(value);
            }
            else {
                // Extend rows beyond the original height
                // Use the last row of the original table
                var lastRow = tableArray[arrayHeight - 1];
                if (col < arrayWidth) {
                    // Standard column from last row
                    // ECU still applies >>1
                    value = lastRow[col];
                } else {
                    // Boost column from last row
                    var base = lastRow[arrayWidth - 1];
                    var boostColIndex = col - (arrayWidth - 1);
                    // Apply compound boost fuel increase
                    value = Math.round(base * Math.pow(boostFactor, boostColIndex));
                    value = Math.floor(value);
                    
                }
            }
            // Ensure value is byte-safe before writing to ROM
            if (value < 0) {
                value = 0;
            } else if (value > 255) {
                value = 255;
            }
            // Calculate the memory address
            memoryAddress = address + (col + (row * newWidth));
            // Write the value to ROM
            rom.byteAt(memoryAddress) = value;
        }
    }
    return memoryAddress;
}

/** Add custom MAP sensor code to ROM */
function __addCustomMapSensorToROM(){
    /** Hooks the call to the stock offset function, and scales the custom sensor to the stock offset value.
     * Also adjusts sensor reading DTC boundaries
     * org 0x1f71
     *                  CAL     OffsetCustomMap             ; 32 LL HH
     *                  ;CAL    label_447f                  ; 32 7f 44
     * 
     * org 0x7420
        customMapNFOmin:            DW 0000bh               ; Custom MAP sensor 0v mbar + 0x8000. For CROME handling
        customMapNFOmax:            DW 00c53h               ; Custom MAP sensor 5v mbar + 0x8000. For CROME handling
        useCustomMap:           	DB 000h					; Any non zero will indicate a custom MAP being used
        CustomAdcMAX:   			DW 05310h				; Custom MAP ADC equiv to stock 8 Bit offset MAX
        OffsetMapMAX:           	DW 000ffh				; Stock 8 Bit offset MAX
        CustomAdcMIN:				DW 007e0h				; Custom MAP ADC equiv to stock 8 Bit offset MIN
        OffsetMapMIN:           	DW 00000h				; Stock 8 Bit offset MIN 

        OffsetCustomMap:
        				PUSHS 	A							; Push byte swapped MAP ADC value to stack
        				MOV 	X1, #useCustomMap			; Address to custom MAP variable
        				LCB 	A, [X1]						; Using Stock MAP?
        				JEQ		limitMAX					; No, Jump to start scaling
        				POPS 	A							; Yes, Pop byte swapped MAP ADC value
        				LB 		A, ACC						; DD = 0
        				J		label_447f					; Go to Stock offset function and RT from there				


        limitMAX:     	INC 	X1 							; Move pointer to the scaling table
        				POPS 	A  							; Get MAP ADC value
        				SWAP 								; Undo the SWAP that was done before this function was called	
        				CMPC    A, [X1]      				; Is the MAP ADC value > table MAX
        				JLT     limitMIN   					; No, jump to check the MIN
        				LC      A, [X1]      				; Yes, use the table MAX

        limitMIN:     	CMPC    A, 00004h[X1] 				; Is the MAP ADC value < table MIN
        				JGE     callLookup   				; No, jump to the scaling call
        				LC      A, 00004h[X1]				; Yes, use the table MIN

        callLookup:   	CAL     label_4454					; Call the stock scaling function
         				LB 		A, ACC						; DD = 0
        				RT									; Return to the stock MAP processing area
     */
    var CUSTOM_MAP_HOOK_LOC = 0x1f71;
    var handlerLoc = address.CUSTOM_MAP_SENSOR_HANDLER_LOC;
    var handlerCodeStart = P13.addressToBytes(mapSensor.CUSTOM_MAP_HANDLER_CODE_START_LOC);
    var tableStart = P13.addressToBytes(mapSensor.CUSTOM_MAP_CONVERSION_TABLE_LOC);
    var CUSTOM_MAP_HOOK_PATCHED = [handlerCodeStart[1], handlerCodeStart[0]]; 
    var CUSTOM_MAP_HANDLER_CODE = [
        0x00, 0x00, 0x00, 0x00, 0x00, 0x10, 0x53, 0xff, 0x00, 0xE0, 
        0x07, 0x00, 0x00, 0x55, 0x60, tableStart[1], tableStart[0], 0x90, 0xAA, 0xC9, 
        0x06, 0x65, 0xF5, 0x06, 0x03, 0x7F, 0x44, 0x70, 0x65, 0x83, 
        0x90, 0xAC, 0xCA, 0x02, 0x90, 0xA8, 0x90, 0xAD, 0x04, 0x00, 
        0xCD, 0x04, 0x90, 0xA9, 0x04, 0x00, 0x32, 0x54, 0x44, 0xF5, 
        0x06, 0x01
    ];
    
    // Write Hook 
    P13.rom_write(CUSTOM_MAP_HOOK_LOC, CUSTOM_MAP_HOOK_PATCHED, CUSTOM_MAP_HOOK_PATCHED.length);

    // Write Handler
    P13.rom_write(handlerLoc, CUSTOM_MAP_HANDLER_CODE, CUSTOM_MAP_HANDLER_CODE.length);
   
    // Set the flag to show custom MAP is being used
    rom.byteAt(mapSensor.USING_STOCK_MAP_SENSOR_LOC) = 0x00;

}

/** Adds custom MAP capabilities to ROM. Input the new sensors values at 0v and 5v and DTC limit
 * Enter 0 and 5v mbar values for the sensor and the Min and Max boundaries for determining an error
 * and setting Code 3
*/
function __setCustomMapSensor(mbar0V, mbar5V, mbarMIN, mbarMAX){

    // Validate before the first write: the hook must never point at a half-configured handler
    var values = [mbar0V, mbar5V, mbarMIN, mbarMAX];
    for (var v = 0; v < values.length; v++) {
        if (typeof values[v] !== 'number' || isNaN(values[v]) || values[v] < -0x8000 || values[v] > 0x7FFF) {
            throw new Error("Custom MAP sensor value out of range: " + values[v]);
        }
    }
    if (mbar5V <= mbar0V) throw new Error("Custom MAP sensor: mBar at 5V must be greater than mBar at 0V.");
    if (__hasOffsetToAxisRaw() && __offsetToAxisRawConstants(mbar0V, mbar5V) === null) throw new Error(CUSTOM_MAP_RANGE_NOT_BOOST_READY);

    // Install custom MAP code if not already done
    if(rom.byteAt(mapSensor.USING_STOCK_MAP_SENSOR_LOC) !== 0x00 ){
        __addCustomMapSensorToROM();
    }
    
    // Setup MAP conversion values , to convert new map to stock offset MAP values
    var min8BitAdc = P13.map_adcToMbar(address.MAP_STOCK_OFFSET_MIN_ADC , address.MAP_STOCK_0V_MBAR , address.MAP_STOCK_5V_MBAR);		// Get Mbar value for 8 Bit minimum ADC
	var max8BitAdc = P13.map_adcToMbar(address.MAP_STOCK_OFFSET_MAX_ADC , address.MAP_STOCK_0V_MBAR , address.MAP_STOCK_5V_MBAR);     // Get Mbar value for 8 Bit maximum ADC
	var CustomAdcMIN = P13.map_mbarToADC(min8BitAdc, mbar0V , mbar5V);	                                    // Convert mBar minimum value to new sensors ADC equivalent
	var CustomAdcMAX = P13.map_mbarToADC(max8BitAdc, mbar0V , mbar5V);	                                    // Convert mBar maximum value to new sensors ADC equivalent

    // Update ROM conversion table
    rom.wordAt(mapSensor.CUSTOM_MAP_ADC_AT_108_MBAR_LOC) = CustomAdcMIN;                                    // Write min to ROM table
    rom.wordAt(mapSensor.CUSTOM_MAP_ADC_AT_1031_MBAR_LOC) = CustomAdcMAX;                                   // Write max to rom table

    // Store MAP sensor values in ROM for CROME to read later
    rom.wordAt(mapSensor.CUSTOM_MAP_NFO_MIN) = 0x8000 + mbar0V;
    rom.wordAt(mapSensor.CUSTOM_MAP_NFO_MAX) = 0x8000 + mbar5V;

    // update DTC boundaries
    var lowBoundary = P13.map_mbarToADC(mbarMIN, mbar0V, mbar5V) >> 8;
    var highBoundary = P13.map_mbarToADC(mbarMAX, mbar0V, mbar5V) >> 8;
    P13.map_SetDTCBoundaries(lowBoundary, highBoundary, false);

    // Update scalars before updating CROME MAP Info
    if(rom.byteAt(address.MAP_USING_OFFSET_SCALARS_LOC) === 0x00){
    __updateMapScalars();
    // The column fallback converts to this sensor's scale, so it must follow the new range
    if(__hasOffsetToAxisRaw()) __writeOffsetToAxisRawConstants(mbar0V, mbar5V);
    }

    
    // Update MAP sensor info
    rom.addressOf('NFO_MAP_MIN') = rom.wordAt(mapSensor.CUSTOM_MAP_NFO_MIN);
    rom.addressOf('NFO_MAP_MAX') = rom.wordAt(mapSensor.CUSTOM_MAP_NFO_MAX);
    rom.hasBoost = 3;
    
    // Update CROME 
    address.Refresh(true);

}
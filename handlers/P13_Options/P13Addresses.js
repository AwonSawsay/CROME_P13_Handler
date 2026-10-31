/*********************************************************************
P13 ROM Addresses for CROME
*********************************************************************
Contains ROM and RAM locations and references for P13 based ROMs
This code aims to keep all global spec "magic numbers" and static 
addresses out of all of the other code files, making updates, changes
and debugging easier.
access via "address.property"

Changelog:
    -v1.0   - Initial working release - March 2026
********************************************************************/
var P13_ADDRESSES_VERSION = '1.0';
var P13_RELEASE_VERSION = "02.01";                  // Version number baked into ROM . Keep format XX.XX only. For 01.35 The rom bytes will be 0x23 , 0x01.

/// <reference path="./P13Helper.js" />

//*************** ROM Addresses *************************************/
var address = {
    // Fuel Multiplier and table 
    TBL_LOW_CAM_ROW_XPLIER_LOC: 0x605a,		            // Location of the main fuel multiplier for low cam table
    TBL_LOW_CAM_FUEL_ADDON_LOC: 0x606e,		            // Location of the main fuel addon table for low cam table
    TBL_HI_CAM_ROW_XPLIER_LOC: 0x6082,			        // Location of the main fuel multiplier for High cam table
    TBL_HI_CAM_FUEL_ADDON_LOC: 0x6096,		            // Location of the main fuel addon table for high cam table
    
    // Table dimension locations
    TABLE_HEIGHT_LOC_1: 0x4673,                         // RPM scalar rows. (Tableheight * 2) -2
    TABLE_HEIGHT_LOC_2: 0x468e,                         // RPM scalar rows. (TableHeight - 2)
    TABLE_WIDTH_LOC_1: 0x4546,                          // Fuel / Ignition table width
    TABLE_WIDTH_LOC_2: 0x4554,                          // Fuel / Ignition table width
    TABLE_WIDTH_LOC_3: 0x46b9,                          // MAP scalar columns. (TableWidth - 2)
    TABLE_WIDTH_LOC_4: 0x46e5,                          // MAP scalar columns. (TableWidth - 2)
    
    // ROM References to tables 
    // (Read the ROM at these lcoations to get table addresses)
    LOW_FUEL_REF: 0x2d00,                               
    HIGH_FUEL_REF: 0x2cf5,
    LOW_IGNITION_REF: 0x2300,
    HIGH_IGNITION_REF: 0x2323,
    MAP_SCALAR_REF: 0x46c2,
    LOW_CAM_RPM_SCALAR_REF: 0x222e,
    HIGH_CAM_RPM_SCALAR_REF: 0x2246,
    
    // Fuel
    FUEL_TABLE_MAX_VALUE_LOC: 0x6921,                   // Maximum allowed table value after ECT + Knock adjustment
    FUEL_TABLE_ALT_MIN_VALUE_LOC: 0x6922,               // Minimum allowed fuel value after ECT + Knock adjustment. Special Use case.
    FUEL_TABLE_MIN_MAX_DEFAULT_VALUE: 0x58,             // Default value used for both min and max thresholds above
    LARGER_FUEL_RANGE_PATCH1_LOC: 0x2d0d,               // Location where ROM divides fuel table value by 2

    // Misc
    EGR_DISABLE_PATCH_LOC: 0x34d2,                      // EGR disable patch area
    REV_CUT1_LOC: 0x540f,                               // Rev cut 1
    REV_RES1_LOC: 0x540B,                               // Rev resume 1
    REV_CUT2_LOC: 0x5407,                               // Rev cut 2
    REV_RES2_LOC: 0x5403,                               // Rev resume 2
    REV_CUT3_LOC: 0x0c26,                               // Rev Cut 3
    REV_RES3_LOC: 0x0c21,                               // Rev Resume 3
    VTEC_COOL_LOC: 0x35CA,                              // VTEC Coolant temp threshold
    DEBUG_MODE_LOC: 0x7ff1,                             // debug mode flag
    SPEED_LIMIT_LOC: 0x2EAC,                            // speed limit threshold
    TARGET_IDLE_1_LOC: 0x1474,                          // Target idle 1
    TARGET_IDLE_2_LOC: 0x1487,
    HI_VTEC_ON_LOC: 0x35A2,
    HI_VTEC_OFF_LOC: 0x359D,
    LO_VTEC_ON_LOC: 0x35AE,
    LO_VTEC_OFF_LOC: 0x35A9,
    IAB_ON_LOC: 0x1B9B,
    IAB_OFF_LOC: 0x1B96,
    ICS_ON_LOC: 0x1ba8,
    ICS_OFF_LOC: 0x1ba3,
    
    // MAP Sensor Values
    MAP_STOCK_0V_MBAR: -70,
    MAP_STOCK_5V_MBAR: 1790,
    MAP_STOCK_OFFSET_MIN_ADC: 0x1880,
    MAP_STOCK_OFFSET_MAX_ADC: 0x9780,
    MAP_LOWER_THRESHOLD_LOC: 0x1F66,                            // Location for lowest valid MAP reading (Single High byte ADC)
    MAP_UPPER_THRESHOLD_LOC: 0x1F62,                            // Location for highest valid MAP reading (Single High byte ADC)
    MAP_COL_FUNC_HOOK_LOC: 0x2212,                              // Code to create raw map col and fractional col called from this location
    LOOKUP_RAW_COL_HOOK_LOC: 0x4547,                            // Fuel / ign lookup patch code called from this location    
    
    // Boost Values
    MAX_BOOSTED_FUEL_BYTE_VALUE: 0xFF,			                // Modified ECU imposed limit on fuel table values - MAX
    MIN_BOOSTED_FUEL_BYTE_VALUE: 0x40,			                // Modified ECU imposed limit on fuel table values - MIN
    ALLOW_BOOST_FUEL_OFFSET_MAP_THRESHOLD: 0xFD,                // Min value which the ECU will skip the max fuel table value check, (Boost setup)
    FUEL_BOUNDARY_SKIP_ON_BOOST_HOOK_LOC: 0x2DA3,               // Fuel boundary skip patch code called from this location

    // Custom ROM code Locations
    DATALOGGER_LOC: 0x7150,                                     // Main datalogger code start location
    VTEC_MIL_FUNC_LOC: 0x73B0,                                  // VTEC MIL output function location 
    ALT_VTEC_FUNC_LOC: 0x73C0,                                  // ALT VTEC output function location 
    ALT_VTEC_PORTB_LOC: 0x73C2,                                 // ROM Location that will be copied to Port B register used for Alt VTEC outputs
    RP_FORCE_JMPR_FUNC_LOC_MAIN: 0x73E0,                        // RP Jumper custom code location 
    IGN_CUT_MAIN_FUNC_LOC: 0x7400,                              // Ignition cut function location 
    RAW_BARO_COLUMN_PATCH_LOC: 0x7420,
    FUEL_BOUNDARY_SKIP_ON_BOOST_PATCH_LOC: 0x7440,              // Patch location used to skip fuel table value thresholds while boosted
    DISABLE_FUEL_ADJ_CUSTOM_CODE_LOC: 0x7460,                   // Code patch to bypass fuel compensations
    CUSTOM_MAP_SENSOR_HANDLER_LOC: 0x7480,                      // Location for custom MAP sensor function
    MAP_USING_OFFSET_SCALARS_LOC: 0x7FBD,                       // Bool for using offset MAP scalars location
    TABLES_USING_STANDARD_SIZE: 0x7FBE,                         // Bool for using standard size fuel / ign tables 0x00 == false
    USE_STOCK_FUEL_RANGE: 0x7FBF,                               // Bool to indicate if using expanded fuel table range
    HANDLER_RELEASE_VERSION_LOC: 0x7FC0,                        // Location to store handler version in ROM for reference Low byte
    HANDLER_RELEASE_VERSION_LOC_HI: 0x7FC1,                     // Location to store handler version in ROM for reference Hi byte
    HANDLER_RELEASE_PREV_VERSION_LOC: 0x7FC2,                   // Location to store previous handler version in ROM for reference Low byte
    HANDLER_RELEASE_PREV_VERSION_LOC_HI: 0x7FC3,                // Location to store previous handler version in ROM for reference Hi byte
    
    // RP Jumper override locations
    RP_1_2_OVERRIDE_LOC: 0x1920,                                // Location to control RP 1 2 jumper
    RP_3_4_OVERRIDE_LOC: 0x18DE,                                // Location to control RP 3 4 jumper
    RP_7_8_OVERRIDE_LOC: 0x19DB,                                // Location to control RP 7 8 jumper
    RP_9_10_OVERRIDE_LOC: 0x1A01,                               // Location to control RP 9 10 jumper 
    RP_11_12_OVERRIDE_LOC: 0x0FC4,                              // Location to control RP 11 12 jumper 
    RP_13_14_OVERRIDE_LOC: 0x1998,                              // Location to control RP 13 14 jumper 

    // Multiplier locations
    RP7_FUEL_XPLIER_PATCH_LOC: 0x48fa,                          // Area to overwrite stock RP jumper fuel multiplier with custom multiplier 
    RP7_FUEL_XPLIER_PATCH2_LOC: 0x48fd,                         // Area to check for multiplier patch 
    RP7_FUEL_XPLIER_MSB_LOC: 0x48fa,                            // When using custom multiplier this is the hi byte of a 0x200 base multiplier
    RP7_FUEL_XPLIER_LSB_LOC: 0x48fc,                            // When using custom multiplier this is the lo byte of a 0x200 base multiplier

    // Custom RAM locations     
    DL_STATUS_BYTE_1: 0x3f0,                                    // Location used to make digital status bytes compatible with Crome / HTS Loggers (003b0h)
    DL_STATUS_BYTE_2: 0x3f0,                                    // Location used to make digital status bytes compatible with Crome / HTS Loggers (003b1h)
    DL_STATUS_BYTE_3: 0x3f0,                                    // Location used to make digital status bytes compatible with Crome / HTS Loggers (003b2h)
    DL_STATUS_BYTE_4: 0x3f0,                                    // Location used to make digital status bytes compatible with Crome / HTS Loggers (003b3h)
    RAM_CUSTOM_RAM_FLAGS: 0xF9,                                 // Unused so far
//************************************************************************ */

/** Define Addresses for CROME registers */
DefineAddresses: function(){
    var tableSize                   = P13.getTableSize();
    var cromeTableSize              = (tableSize.height << 8) + tableSize.width;
    rom.addressOf('NFO_LOW_TABLE')  = cromeTableSize;
    rom.addressOf('NFO_HIGH_TABLE') = cromeTableSize;
    rom.addressOf('LOW_REV_SCALAR') = rom.wordAt(this.LOW_CAM_RPM_SCALAR_REF);
    rom.addressOf('HIGH_REV_SCALAR')= rom.wordAt(this.HIGH_CAM_RPM_SCALAR_REF);
    rom.addressOf('LOW_MAP_SCALAR') = rom.wordAt(this.MAP_SCALAR_REF);
    rom.addressOf('HIGH_MAP_SCALAR')= rom.wordAt(this.MAP_SCALAR_REF);
    rom.addressOf('LOW_IGNITION')   = rom.wordAt(this.LOW_IGNITION_REF);
    rom.addressOf('HIGH_IGNITION')  = rom.wordAt(this.HIGH_IGNITION_REF);
    rom.addressOf('LOW_FUEL')       = rom.wordAt(this.LOW_FUEL_REF);
    rom.addressOf('HIGH_FUEL')      = rom.wordAt(this.HIGH_FUEL_REF);
    rom.addressOf('REVCUT1')        = this.REV_CUT1_LOC;
    rom.addressOf('REVRES1')        = this.REV_RES1_LOC;
    rom.addressOf('REVCUT2')        = this.REV_CUT2_LOC;
    rom.addressOf('REVRES2')        = this.REV_RES2_LOC;
    rom.addressOf('VTECCOOL')       = this.VTEC_COOL_LOC;
    rom.addressOf('DEBUGMODE')      = this.DEBUG_MODE_LOC;
    rom.addressOf('SPEED_LIMIT')    = this.SPEED_LIMIT_LOC;

    // Default MAP sensor values 
    rom.addressOf('NFO_MAP_MIN') = this.MAP_STOCK_0V_MBAR + 0x8000;
    rom.addressOf('NFO_MAP_MAX') = this.MAP_STOCK_5V_MBAR + 0x8000;

    rom.hasBoost = 0;
    // Boosted?
    if(rom.byteAt(this.TABLES_USING_STANDARD_SIZE) === 0x00 ){
        rom.hasBoost = 1;
    }
    
    // Custom MAP
    if(rom.byteAt(mapSensor.USING_STOCK_MAP_SENSOR_LOC) === 0x00){
        rom.addressOf('NFO_MAP_MIN') = rom.wordAt(mapSensor.CUSTOM_MAP_NFO_MIN);
        rom.addressOf('NFO_MAP_MAX') = rom.wordAt(mapSensor.CUSTOM_MAP_NFO_MAX);
        rom.hasBoost = 3;
    }
},

    /** Refresh CROME addresses from ROM*/
    Refresh: function(reload) {
        if(reload === undefined)reload = false; 
        // Fetch all info from ROM
        this.DefineAddresses(reload);
        
        try { 
            refresh();
            if(reload)reload();
            return; 
        } 
        catch(e) {}
        try { 
            window.external.refresh(); 
            if(reload)window.external.reload();
            return; 
        } 
        catch(e) {}

        alert("Failed to refresh()");
    }


}

var mapSensor ={
    CUSTOM_MAP_NFO_MIN: address.CUSTOM_MAP_SENSOR_HANDLER_LOC,                      // Custom MAP sensor mBar value at 0v
    CUSTOM_MAP_NFO_MAX: address.CUSTOM_MAP_SENSOR_HANDLER_LOC +2,                   // Custom MAP sensor mBar value at 5v
    USING_STOCK_MAP_SENSOR_LOC: address.CUSTOM_MAP_SENSOR_HANDLER_LOC +4,           // Bool location for 'usingStockMapSensor' 0x00 = false
    CUSTOM_MAP_ADC_AT_1031_MBAR_LOC: address.CUSTOM_MAP_SENSOR_HANDLER_LOC +5,      // Location of custom map sensor ADC value for stock honda's offset MAP MAX
    CUSTOM_MAP_ADC_AT_108_MBAR_LOC: address.CUSTOM_MAP_SENSOR_HANDLER_LOC +9,       // Location of custom map sensor ADC value for stock honda's offset MAP MAX
    CUSTOM_MAP_HANDLER_CODE_START_LOC:  address.CUSTOM_MAP_SENSOR_HANDLER_LOC +13,  // Location that the handler code actually starts
    CUSTOM_MAP_CONVERSION_TABLE_LOC: address.CUSTOM_MAP_SENSOR_HANDLER_LOC +4       // Location of conversion table, that starts with UsingStockMapSensor bool
}
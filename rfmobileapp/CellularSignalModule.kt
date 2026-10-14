package com.rfmobileapp

import android.telephony.CellInfo
import android.telephony.CellInfoLte
import android.telephony.CellInfoNr
import android.telephony.CellInfoGsm
import android.telephony.CellInfoWcdma
import android.telephony.TelephonyManager
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise

class CellularSignalModule(
    private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String {
        return "CellularSignal"
    }

    @ReactMethod
    fun getSignalInfo(promise: Promise) {
        try {
            val telephonyManager =
                reactContext.getSystemService("phone") as TelephonyManager

            val result = Arguments.createMap()

            // Service provider
            result.putString(
                "carrier",
                telephonyManager.networkOperatorName ?: "Unknown"
            )

            // Network operator
            result.putString(
                "operator",
                telephonyManager.networkOperator ?: "Unknown"
            )

            // Try to obtain cellular signal information
            val cellInfoList: List<CellInfo>? =
                telephonyManager.allCellInfo

            var rssi = -999
            var networkType = "Unknown"

            if (cellInfoList != null) {
                for (cellInfo in cellInfoList) {

                    if (!cellInfo.isRegistered) {
                        continue
                    }

                    when (cellInfo) {

                        is CellInfoLte -> {
                            rssi = cellInfo.cellSignalStrength.dbm
                            networkType = "LTE / 4G"
                            break
                        }

                        is CellInfoNr -> {
                            rssi = cellInfo.cellSignalStrength.dbm
                            networkType = "5G"
                            break
                        }

                        is CellInfoGsm -> {
                            rssi = cellInfo.cellSignalStrength.dbm
                            networkType = "GSM / 2G"
                            break
                        }

                        is CellInfoWcdma -> {
                            rssi = cellInfo.cellSignalStrength.dbm
                            networkType = "WCDMA / 3G"
                            break
                        }
                    }
                }
            }

            result.putInt("rssi", rssi)
            result.putString("networkType", networkType)

            promise.resolve(result)

        } catch (e: Exception) {
            promise.reject(
                "SIGNAL_ERROR",
                e.message,
                e
            )
        }
    }
}
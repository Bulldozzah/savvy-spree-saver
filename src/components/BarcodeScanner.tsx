import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Camera, X } from "lucide-react";

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
  scanning: boolean;
  onStartScan: () => void;
  onStopScan: () => void;
}

export const BarcodeScanner = ({ onDetected, scanning, onStartScan, onStopScan }: BarcodeScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  const startScanning = async () => {
    onStartScan();
    const scanner = new Html5Qrcode("barcode-reader");
    scannerRef.current = scanner;

    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          onDetected(decodedText);
          scanner.stop().catch(() => {});
          onStopScan();
        },
        () => {}
      );
    } catch (err) {
      console.error("Scanner error:", err);
      onStopScan();
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop().catch(() => {});
    }
    onStopScan();
  };

  return (
    <div className="space-y-3">
      <div
        id="barcode-reader"
        ref={containerRef}
        className={scanning ? "w-full rounded-lg overflow-hidden" : "hidden"}
      />
      {!scanning ? (
        <Button onClick={startScanning} className="w-full gap-2" size="lg">
          <Camera className="h-5 w-5" />
          Scan Barcode
        </Button>
      ) : (
        <Button onClick={stopScanning} variant="destructive" className="w-full gap-2">
          <X className="h-5 w-5" />
          Stop Scanning
        </Button>
      )}
    </div>
  );
};

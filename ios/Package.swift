// swift-tools-version:5.5
import PackageDescription

let package = Package(
    name: "NodexVpnApp",
    platforms: [
        .iOS(.v13)
    ],
    products: [
        .library(
            name: "NodexVpnApp",
            targets: ["NodexVpnApp"]
        ),
    ],
    dependencies: [
        // WireGuard oficial de Apple
        .package(
            url: "https://github.com/WireGuard/wireguard-apple.git",
            from: "1.0.0"
        ),
        // Dependencia de React Native
        .package(
            url: "https://github.com/facebook/react-native.git",
            from: "0.72.0"
        ),
    ],
    targets: [
        .target(
            name: "NodexVpnApp",
            dependencies: [
                .product(name: "WireGuardKit", package: "wireguard-apple"),
                .product(name: "WireGuardKitGo", package: "wireguard-apple"),
                .product(name: "WireGuardKitC", package: "wireguard-apple"),
            ],
            path: "NodexVpnApp",
            sources: [
                "RealWireGuardModule.swift",
                "RealWireGuardModule.m"
            ]
        ),
        .target(
            name: "WireGuardExtension",
            dependencies: [
                .product(name: "WireGuardKit", package: "wireguard-apple"),
                .product(name: "WireGuardKitGo", package: "wireguard-apple"),
                .product(name: "WireGuardKitC", package: "wireguard-apple"),
            ],
            path: "WireGuardExtension",
            sources: [
                "WireGuardTunnelProvider.swift"
            ]
        ),
    ]
) 
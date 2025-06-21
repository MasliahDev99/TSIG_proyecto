package com.tsig.tsig2025.DataTypes;

public class RouteRequest {
    private double[] startCoordinate;
    private double[] endCoordinate;

    public RouteRequest() {
    }

    public RouteRequest(double[] startCoordinate, double[] endCoordinate) {
        this.startCoordinate = startCoordinate;
        this.endCoordinate = endCoordinate;
    }

    public double[] getStartCoordinate() {
        return startCoordinate;
    }

    public void setStartCoordinate(double[] startCoordinate) {
        this.startCoordinate = startCoordinate;
    }

    public double[] getEndCoordinate() {
        return endCoordinate;
    }

    public void setEndCoordinate(double[] endCoordinate) {
        this.endCoordinate = endCoordinate;
    }
}

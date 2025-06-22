package com.tsig.tsig2025.DataTypes;

public class RouteResponse {
    private boolean success;
    private String message;
    private double[][] route;
    private double totalDistance;

    public RouteResponse() {}

    public RouteResponse(boolean success, String message, double[][] route, double totalDistance) {
        this.success = success;
        this.message = message;
        this.route = route;
        this.totalDistance = totalDistance;
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public double[][] getRoute() {
        return route;
    }

    public void setRoute(double[][] route) {
        this.route = route;
    }

    public double getTotalDistance() {
        return totalDistance;
    }

    public void setTotalDistance(double totalDistance) {
        this.totalDistance = totalDistance;
    }
}

package edu.brown.cs.rwdodd.maps;

public class Road {
  private String type;
  private String name;
  private Double lat1;
  private Double long1;
  private Double lat2;
  private Double long2;
  public Road(String name, String type, Double lat1, Double long1, Double lat2, Double long2){
    this.name = name;
    this.type = type;
    this.lat1 = lat1;
    this.long1 = long1;
    this.lat2 = lat2;
    this.long2 = long2;
  }
  public String getName(){
    return name;
  }
  public String getType(){
    return type;
  }
  public Double getlat1(){
    return lat1;
  }
  public Double getlong1(){
    return long1;
  }
  public Double getlat2(){
    return lat2;
  }
  public Double getlong2(){
    return long2;
  }
}

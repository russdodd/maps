package edu.brown.cs.rwdodd.maps;

import java.io.File;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

public class DbQuery {


  private Connection conn;
  /**
   * This constructor takes in a path to the db file
   * @param db Path to the db file
   * @throws ClassNotFoundException
   * @throws SQLException incase
   */
  public DbQuery(File db) throws ClassNotFoundException, SQLException {
    Class.forName("org.sqlite.JDBC");
    String urlToDB = "jdbc:sqlite:" + db;

    conn = DriverManager.getConnection(urlToDB);
  }

  public List<Road> queryWays(Double latTL, Double longTL, Double latBR, Double longBR) throws SQLException {

    String query1 = "SELECT n1.latitude AS lat1, n1.longitude AS long1, way.name AS name, way.type AS type, n2.latitude AS lat2, n2.longitude AS long2 "
        + "FROM node n1 "
        + "INNER JOIN way ON n1.id=way.start AND n1.latitude<=? AND n1.latitude>=? AND n1.longitude<=? AND n1.longitude>=? "
        + "INNER JOIN node n2 ON n2.id=way.end";

    String query2 = "SELECT way.id AS id, n1.latitude AS lat1, n1.longitude AS long1, way.name AS name, way.type AS type, n2.latitude AS lat2, n2.longitude AS long2 "
        + "FROM node n1 "
        + "INNER JOIN way ON n1.id=way.end AND n1.latitude<=? AND n1.latitude>=? AND n1.longitude<=? AND n1.longitude>=? "
        + "INNER JOIN node n2 ON n2.id=way.start";
    PreparedStatement prep = conn.prepareStatement(query1);
    prep.setDouble(1, latTL);
    prep.setDouble(2, latBR);
    prep.setDouble(3, longBR);
    prep.setDouble(4, longTL);


    ResultSet rs = prep.executeQuery();

    List<Road> toReturn = new ArrayList<Road>();
    while (rs.next()) {
      Double lat1 = rs.getDouble("lat1");
      Double long1 = rs.getDouble("long1");
      Double lat2 = rs.getDouble("lat2");
      Double long2 = rs.getDouble("long2");
      String name = rs.getString("name");
      String type = rs.getString("type");

      Road road = new Road(name, type, lat1, long1, lat2, long2);
          toReturn.add(road);
        }
    rs.close();
    prep.close();

    prep = conn.prepareStatement(query2);
    prep.setDouble(1, latTL);
    prep.setDouble(2, latBR);
    prep.setDouble(3, longBR);
    prep.setDouble(4, longTL);


    rs = prep.executeQuery();

    while (rs.next()) {
      Double lat1 = rs.getDouble("lat1");
      Double long1 = rs.getDouble("long1");
      Double lat2 = rs.getDouble("lat2");
      Double long2 = rs.getDouble("long2");
      String name = rs.getString("name");
      String type = rs.getString("type");

      Road road = new Road(name, type, lat1, long1, lat2, long2);
          toReturn.add(road);
        }
    rs.close();
    prep.close();
    return toReturn;
  }

  public String queryInter(String name1, String name2) throws SQLException {

    String query1 = "SELECT node.id AS id "
        + "FROM node "
        + "INNER JOIN way w1 ON w1.name=? AND (w1.start=node.id OR w1.end=node.id) "
        + "INNER JOIN way w2 ON w2.name=? AND (w2.start=node.id OR w2.end=node.id) ";
     PreparedStatement prep = conn.prepareStatement(query1);
     prep.setString(1, name1);
     prep.setString(2, name2);

     ResultSet rs = prep.executeQuery();

     String toReturn;
     rs.next();
       String id = rs.getString("id");
       toReturn = id;

     rs.close();
     prep.close();

     return toReturn;
   }
}




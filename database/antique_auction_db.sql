-- MySQL dump 10.13  Distrib 8.0.33, for Win64 (x86_64)
--
-- Host: localhost    Database: antique_auction_db
-- ------------------------------------------------------
-- Server version	8.0.33

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `antique_item`
--

DROP TABLE IF EXISTS `antique_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `antique_item` (
  `item_id` int NOT NULL,
  `owner_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `category` varchar(50) DEFAULT NULL,
  `description` text,
  `year_made` int DEFAULT NULL,
  `origin` varchar(100) DEFAULT NULL,
  `condition_status` varchar(100) DEFAULT NULL,
  `current_status` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`item_id`),
  KEY `owner_id` (`owner_id`),
  CONSTRAINT `antique_item_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `owner` (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `antique_item`
--

LOCK TABLES `antique_item` WRITE;
/*!40000 ALTER TABLE `antique_item` DISABLE KEYS */;
INSERT INTO `antique_item` VALUES (1,1,'Mysore Palace Painting','Painting','Traditional Mysore painting',1920,'Mysuru, India','Excellent','Auctioned'),(2,2,'Brass Temple Lamp','Religious Artifact','Traditional brass temple lamp',1890,'Tamil Nadu, India','Good','Auctioned'),(3,3,'Royal Wooden Chest','Furniture','Traditional teak wood chest',1850,'Delhi, India','Good','Auctioned'),(4,4,'Antique Silver Necklace','Jewellery','Handcrafted silver necklace',1910,'Rajasthan, India','Excellent','Auctioned'),(5,5,'Persian Ceramic Vase','Ceramic','Decorative Persian vase',1880,'Tehran, Iran','Very Good','Auctioned'),(6,1,'Vintage Typewriter','Mechanical','Antique working typewriter',1935,'Berlin, Germany','Good','Auctioned'),(7,2,'Bronze Warrior Statue','Sculpture','Traditional bronze warrior statue',1750,'Rajasthan, India','Excellent','Auctioned'),(8,3,'Colonial Wall Clock','Clock','Colonial brass wall clock',1905,'Bengaluru, India','Good','Available');
/*!40000 ALTER TABLE `antique_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auction`
--

DROP TABLE IF EXISTS `auction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auction` (
  `auction_id` int NOT NULL,
  `item_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` varchar(500) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `base_price` decimal(12,2) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  `auction_type` varchar(50) DEFAULT 'Physical',
  PRIMARY KEY (`auction_id`),
  KEY `item_id` (`item_id`),
  KEY `idx_auction_status` (`status`),
  CONSTRAINT `auction_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `antique_item` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auction`
--

LOCK TABLES `auction` WRITE;
/*!40000 ALTER TABLE `auction` DISABLE KEYS */;
INSERT INTO `auction` VALUES (1,1,'Mysore Heritage Auction','Auction of a traditional Mysore Palace painting.','2026-10-10','2026-10-10','Bengaluru Auction Hall',20000.00,'Upcoming','Physical'),(2,2,'Traditional Artifact Auction','Auction of a historical brass temple lamp.','2026-10-11','2026-10-11','Mysuru Heritage Centre',7000.00,'Upcoming','Physical'),(3,3,'Royal Furniture Auction','Auction of a historical royal wooden chest.','2026-10-12','2026-10-12','Bengaluru Auction Hall',150000.00,'Upcoming','Physical'),(4,4,'Antique Jewellery Auction','Auction of a traditional silver necklace.','2026-10-13','2026-10-13','Mumbai Heritage Hall',10000.00,'Upcoming','Physical'),(5,5,'International Antique Auction','Auction of a Persian ceramic vase.','2026-10-14','2026-10-14','Online',12000.00,'Upcoming','Physical'),(6,6,'Historical Mechanical Objects','Auction of a vintage mechanical typewriter.','2026-10-15','2026-10-15','Bengaluru Auction Hall',3500.00,'Upcoming','Physical'),(7,7,'Test Trigger Auction','Temporary auction to test trigger','2026-11-01','2026-11-01','Bengaluru',250000.00,'Upcoming','Physical');
/*!40000 ALTER TABLE `auction` ENABLE KEYS */;
UNLOCK TABLES;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `after_auction_insert` AFTER INSERT ON `auction` FOR EACH ROW BEGIN
    UPDATE antique_item
    SET current_status = 'Auctioned'
    WHERE item_id = NEW.item_id;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Temporary view structure for view `auction_details`
--

DROP TABLE IF EXISTS `auction_details`;
/*!50001 DROP VIEW IF EXISTS `auction_details`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `auction_details` AS SELECT
 1 AS `auction_id`,
 1 AS `auction_name`,
 1 AS `item_name`,
 1 AS `base_price`,
 1 AS `start_date`,
 1 AS `end_date`,
 1 AS `status`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `bid`
--

DROP TABLE IF EXISTS `bid`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bid` (
  `bid_id` int NOT NULL,
  `auction_id` int NOT NULL,
  `bidder_id` int NOT NULL,
  `bid_amount` decimal(12,2) NOT NULL,
  `bid_time` datetime DEFAULT NULL,
  PRIMARY KEY (`bid_id`),
  KEY `auction_id` (`auction_id`),
  KEY `bidder_id` (`bidder_id`),
  CONSTRAINT `bid_ibfk_1` FOREIGN KEY (`auction_id`) REFERENCES `auction` (`auction_id`),
  CONSTRAINT `bid_ibfk_2` FOREIGN KEY (`bidder_id`) REFERENCES `bidder` (`bidder_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bid`
--

LOCK TABLES `bid` WRITE;
/*!40000 ALTER TABLE `bid` DISABLE KEYS */;
INSERT INTO `bid` VALUES (1,1,1,210000.00,'2026-10-10 10:30:00'),(2,1,2,220000.00,'2026-10-10 11:00:00'),(3,1,3,235000.00,'2026-10-10 11:30:00'),(4,2,1,75000.00,'2026-10-11 10:30:00'),(5,2,2,80000.00,'2026-10-11 11:00:00'),(6,2,3,85000.00,'2026-10-11 11:30:00'),(7,3,2,160000.00,'2026-10-12 10:30:00'),(8,3,4,170000.00,'2026-10-12 11:00:00'),(9,3,5,180000.00,'2026-10-12 11:30:00'),(10,4,1,105000.00,'2026-10-13 11:00:00'),(11,4,3,115000.00,'2026-10-13 11:30:00'),(12,4,4,125000.00,'2026-10-13 12:00:00'),(13,5,2,125000.00,'2026-10-14 11:00:00'),(14,5,5,145000.00,'2026-10-14 12:00:00');
/*!40000 ALTER TABLE `bid` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bidder`
--

DROP TABLE IF EXISTS `bidder`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bidder` (
  `bidder_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `registration_date` date DEFAULT NULL,
  PRIMARY KEY (`bidder_id`),
  KEY `idx_bidder_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bidder`
--

LOCK TABLES `bidder` WRITE;
/*!40000 ALTER TABLE `bidder` DISABLE KEYS */;
INSERT INTO `bidder` VALUES (1,'Rahul Sharma','9000000001','rahul@gmail.com','Bengaluru, Karnataka','2026-08-01'),(2,'Sneha Patil','9000000002','sneha@gmail.com','Mysuru, Karnataka','2026-08-02'),(3,'Karan Mehta','9000000003','karan@gmail.com','Mumbai, Maharashtra','2026-08-03'),(4,'Aisha Khan','9000000004','aisha@gmail.com','Hyderabad, Telangana','2026-08-04'),(5,'Vivek Rao','9000000005','vivek@gmail.com','Chennai, Tamil Nadu','2026-08-05');
/*!40000 ALTER TABLE `bidder` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `owner`
--

DROP TABLE IF EXISTS `owner`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `owner` (
  `owner_id` int NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `owner`
--

LOCK TABLES `owner` WRITE;
/*!40000 ALTER TABLE `owner` DISABLE KEYS */;
INSERT INTO `owner` VALUES (1,'Ravi Kumar','9876500001','ravi.kumar@gmail.com','Mysuru, Karnataka'),(2,'Anita Rao','9876500002','anita.rao@gmail.com','Bengaluru, Karnataka'),(3,'Vikram Shah','9876500003','vikram.shah@gmail.com','Mumbai, Maharashtra'),(4,'Meera Joshi','9876500004','meera.joshi@gmail.com','Jaipur, Rajasthan'),(5,'Arjun Desai','9876500005','arjun.desai@gmail.com','New Delhi, Delhi');
/*!40000 ALTER TABLE `owner` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment`
--

DROP TABLE IF EXISTS `payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment` (
  `payment_id` int NOT NULL,
  `transaction_id` int NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_date` date DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `status` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`payment_id`),
  KEY `transaction_id` (`transaction_id`),
  CONSTRAINT `payment_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `transaction` (`transaction_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment`
--

LOCK TABLES `payment` WRITE;
/*!40000 ALTER TABLE `payment` DISABLE KEYS */;
INSERT INTO `payment` VALUES (1,1,235000.00,'2026-10-10','UPI','Processing'),(2,2,85000.00,'2026-10-11','Card','Completed'),(3,3,180000.00,'2026-10-12','Bank Transfer','Completed');
/*!40000 ALTER TABLE `payment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `provenance`
--

DROP TABLE IF EXISTS `provenance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `provenance` (
  `provenance_id` int NOT NULL,
  `item_id` int NOT NULL,
  `previous_owner` varchar(100) DEFAULT NULL,
  `from_year` int DEFAULT NULL,
  `to_year` int DEFAULT NULL,
  `acquisition_method` varchar(100) DEFAULT NULL,
  `details` text,
  PRIMARY KEY (`provenance_id`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `provenance_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `antique_item` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `provenance`
--

LOCK TABLES `provenance` WRITE;
/*!40000 ALTER TABLE `provenance` DISABLE KEYS */;
INSERT INTO `provenance` VALUES (1,1,'Krishna Rao Family',1920,1960,'Inherited','Passed through three generations of the family.'),(2,1,'Mysore Art Collector Association',1960,1985,'Purchase','Preserved in a private art collection.'),(3,2,'Temple Heritage Trust',1890,1950,'Temple Collection','Used in traditional religious ceremonies.'),(4,3,'Royal Heritage Family',1850,1925,'Inheritance','Historical family storage chest.'),(5,4,'Rajasthani Artisan Family',1910,1970,'Inheritance','Handcrafted traditional jewellery.'),(6,5,'Persian Art Collector',1880,1930,'Purchase','Imported through historical trade routes.'),(7,6,'European Collector',1935,1980,'Purchase','Used as an office typewriter.'),(8,7,'Indian Royal Family',1750,1850,'Inheritance','Displayed in a royal residence.'),(9,8,'British Officer Estate',1905,1947,'Estate Transfer','Colonial residence artifact.');
/*!40000 ALTER TABLE `provenance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transaction`
--

DROP TABLE IF EXISTS `transaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transaction` (
  `transaction_id` int NOT NULL,
  `auction_id` int NOT NULL,
  `winning_bidder_id` int NOT NULL,
  `final_price` decimal(12,2) NOT NULL,
  `transaction_date` date DEFAULT NULL,
  PRIMARY KEY (`transaction_id`),
  KEY `auction_id` (`auction_id`),
  KEY `winning_bidder_id` (`winning_bidder_id`),
  CONSTRAINT `transaction_ibfk_1` FOREIGN KEY (`auction_id`) REFERENCES `auction` (`auction_id`),
  CONSTRAINT `transaction_ibfk_2` FOREIGN KEY (`winning_bidder_id`) REFERENCES `bidder` (`bidder_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transaction`
--

LOCK TABLES `transaction` WRITE;
/*!40000 ALTER TABLE `transaction` DISABLE KEYS */;
INSERT INTO `transaction` VALUES (1,1,3,235000.00,'2026-10-10'),(2,2,3,85000.00,'2026-10-11'),(3,3,5,180000.00,'2026-10-12');
/*!40000 ALTER TABLE `transaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `valuation`
--

DROP TABLE IF EXISTS `valuation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `valuation` (
  `valuation_id` int NOT NULL,
  `item_id` int NOT NULL,
  `estimated_value` decimal(12,2) DEFAULT NULL,
  `valuation_date` date DEFAULT NULL,
  `expert_id` int DEFAULT NULL,
  `expert_name` varchar(100) DEFAULT NULL,
  `method` varchar(50) DEFAULT NULL,
  `remarks` text,
  PRIMARY KEY (`valuation_id`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `valuation_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `antique_item` (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `valuation`
--

LOCK TABLES `valuation` WRITE;
/*!40000 ALTER TABLE `valuation` DISABLE KEYS */;
INSERT INTO `valuation` VALUES (1,1,250000.00,'2026-01-10',101,'Dr. Rajesh Kumar','Historical and Artistic Analysis','Authentic Mysore style painting.'),(2,2,85000.00,'2026-02-15',102,'Prof. Anand Rao','Material and Historical Analysis','Original brass construction.'),(3,3,175000.00,'2026-03-05',103,'Dr. Vikram Singh','Historical Valuation','Teak wood verified.'),(4,4,120000.00,'2026-03-20',104,'Ms. Neha Shah','Material and Craftsmanship','Silver authenticity confirmed.'),(5,5,145000.00,'2026-04-12',105,'Dr. Amir Khan','International Market Comparison','Persian origin verified.'),(6,6,4500.00,'2026-04-20',106,'Mr. Daniel Thomas','Condition and Rarity','Functional antique typewriter.'),(7,7,300000.00,'2026-05-01',107,'Dr. Kavya Rao','Historical and Artistic Analysis','Bronze composition verified.'),(8,8,95000.00,'2026-05-15',108,'Mr. Suresh Iyer','Mechanical and Historical Analysis','Original mechanism preserved.');
/*!40000 ALTER TABLE `valuation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Final view structure for view `auction_details`
--

/*!50001 DROP VIEW IF EXISTS `auction_details`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `auction_details` AS select `a`.`auction_id` AS `auction_id`,`a`.`name` AS `auction_name`,`ai`.`name` AS `item_name`,`a`.`base_price` AS `base_price`,`a`.`start_date` AS `start_date`,`a`.`end_date` AS `end_date`,`a`.`status` AS `status` from (`auction` `a` join `antique_item` `ai` on((`a`.`item_id` = `ai`.`item_id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-28 19:06:56

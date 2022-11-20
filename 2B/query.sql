SELECT (p1.first_name || ' ' || p1.last_name) AS name, IFNULL(GROUP_CONCAT(p2.number), 'N/A') AS number 
FROM people AS p1 LEFT JOIN phones AS p2 ON p2.user_id = p1.id GROUP BY name ORDER BY p2.number;

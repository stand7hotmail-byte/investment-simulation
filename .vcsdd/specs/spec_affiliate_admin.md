# Behavioral Specification: Affiliate Broker Admin Panel (SPEC-010)

## Overview
Administrator can manage broker affiliate links through a secure or administrative interface. This includes viewing, creating, updating, and deleting (CRUD) brokerage information.

## Requirement ID (Bead ID)
`SPEC-010`

## Pre-conditions
- The SQLite database must have the `affiliate_brokers` table.
- Backend API must be running.

## Inputs
- **GET /api/admin/affiliates**: No input (returns all brokers).
- **POST /api/admin/affiliates**: `AffiliateBrokerCreate` schema (name, region, description, cta_text, affiliate_url, etc.).
- **PATCH /api/admin/affiliates/{id}**: `AffiliateBrokerUpdate` schema (partial updates).
- **DELETE /api/admin/affiliates/{id}**: Broker ID to delete.

## Outputs/Effects
- **GET**: Returns a list of all `AffiliateBrokerRead` objects.
- **POST**: Persists a new broker in the database and returns the created object with an ID.
- **PATCH**: Updates the existing broker in the database and returns the updated object.
- **DELETE**: Removes the broker from the database.
- **Frontend**: Displays the broker list in a table, allows inline editing, and provides a form for adding new brokers.

## Edge Cases & Error Handling
- **Invalid ID**: If the ID for PATCH/DELETE does not exist, return a `404 Not Found` error.
- **Validation Error**: If required fields (name, region, affiliate_url) are missing in POST/PATCH, return a `422 Unprocessable Entity` error.
- **Empty Description**: The description list can be empty, but must be a valid JSON array.
- **Non-Standard Region**: Any region other than "JP" should be treated as "GLOBAL" in the recommendation API, but the admin panel should store the exact string provided.

## Pass/Fail Criteria
- [ ] Admin can view a list of all registered brokers.
- [ ] Admin can add a new broker and see it reflected in the list immediately.
- [ ] Admin can update a broker's name or priority and save the changes.
- [ ] Admin can delete a broker and confirm it is removed from the table.

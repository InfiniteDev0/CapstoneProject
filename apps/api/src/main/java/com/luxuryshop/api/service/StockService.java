package com.luxuryshop.api.service;

import com.mongodb.client.result.UpdateResult;
import com.luxuryshop.api.exception.ApiException;
import com.luxuryshop.api.model.document.Product;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

/**
 * Stock lives in MongoDB (inside each product's variants).
 *
 * reserve() lowers stock with ONE atomic command per colour: "take 2 from LS-M-OUT-03-BLK
 * only if at least 2 are left". Two shoppers buying the last jacket at the same moment can't
 * both succeed: MongoDB lets exactly one of them through.
 */
@Service
@RequiredArgsConstructor
public class StockService {

    /** One colour of one product, and how many to take or give back. */
    public record StockLine(String productId, String sku, int quantity, String label) {
    }

    private final MongoTemplate mongo;

    /** Takes the stock for every line, or none of it: if one line fails, the earlier ones are put back. */
    public List<StockLine> reserve(List<StockLine> lines) {
        List<StockLine> taken = new ArrayList<>();
        for (StockLine line : lines) {
            Query enoughLeft = Query.query(Criteria.where("_id").is(new ObjectId(line.productId()))
                    .and("variants").elemMatch(Criteria.where("sku").is(line.sku()).and("stock").gte(line.quantity())));
            UpdateResult result = mongo.updateFirst(enoughLeft,
                    new Update().inc("variants.$.stock", -line.quantity()).set("updatedAt", Instant.now()), Product.class);
            if (result.getModifiedCount() == 0) {
                release(taken);
                throw ApiException.conflict("Sorry, " + line.label() + " just sold out (or not enough left). Please update your bag.");
            }
            taken.add(line);
        }
        return taken;
    }

    /** Gives stock back (a failed checkout, a cancelled order). */
    public void release(List<StockLine> lines) {
        for (StockLine line : lines) {
            mongo.updateFirst(
                    Query.query(Criteria.where("_id").is(new ObjectId(line.productId())).and("variants.sku").is(line.sku())),
                    new Update().inc("variants.$.stock", line.quantity()).set("updatedAt", Instant.now()), Product.class);
        }
    }
}

package com.teleconnect.plan;

import com.teleconnect.plan.entity.AddOn;
import com.teleconnect.plan.entity.TelecomPlan;
import com.teleconnect.plan.repository.AddOnRepository;
import com.teleconnect.plan.repository.TelecomPlanRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;

/**
 * Seeds Indian telecom plans (Jio/Airtel-style pricing in INR) on first startup.
 * Skips seeding if plans already exist in the database.
 */
@Slf4j
@Component
public class PlanDataSeeder implements CommandLineRunner {

    private final TelecomPlanRepository planRepo;
    private final AddOnRepository addOnRepo;

    public PlanDataSeeder(TelecomPlanRepository planRepo, AddOnRepository addOnRepo) {
        this.planRepo = planRepo;
        this.addOnRepo = addOnRepo;
    }

    @Override
    public void run(String... args) {
        if (planRepo.count() == 0) {
            seedPlans();
        } else {
            log.info("[TeleConnect Plan] Plans already seeded ({} records). Skipping.", planRepo.count());
        }

        if (addOnRepo.count() == 0) {
            seedAddOns();
        } else {
            log.info("[TeleConnect Plan] Add-ons already seeded ({} records). Skipping.", addOnRepo.count());
        }
    }

    private void seedPlans() {
        log.info("[TeleConnect Plan] Seeding Indian telecom plans (INR pricing)...");

        List<TelecomPlan> plans = List.of(
            // ── Prepaid Plans (Jio/Airtel style) ──────────────────────────────

            plan("Smart Lite",       TelecomPlan.PlanType.Prepaid, new BigDecimal("28"),
                 0,      100, 28,  new BigDecimal("149")),

            plan("Smart Basic",      TelecomPlan.PlanType.Prepaid, new BigDecimal("42"),
                 0,      100, 28,  new BigDecimal("199")),

            plan("Smart Plus",       TelecomPlan.PlanType.Prepaid, new BigDecimal("56"),
                 0,      100, 28,  new BigDecimal("299")),

            plan("Smart Pro",        TelecomPlan.PlanType.Prepaid, new BigDecimal("70"),
                 0,      100, 28,  new BigDecimal("359")),

            plan("Freedom 56",       TelecomPlan.PlanType.Prepaid, new BigDecimal("56"),
                 0,      100, 56,  new BigDecimal("479")),

            plan("Freedom 84",       TelecomPlan.PlanType.Prepaid, new BigDecimal("168"),
                 0,      100, 84,  new BigDecimal("599")),

            plan("Ultra 84",         TelecomPlan.PlanType.Prepaid, new BigDecimal("210"),
                 0,      100, 84,  new BigDecimal("839")),

            plan("Annual Lite",      TelecomPlan.PlanType.Prepaid, new BigDecimal("730"),
                 0,      100, 365, new BigDecimal("1299")),

            plan("Annual Pro",       TelecomPlan.PlanType.Prepaid, new BigDecimal("912"),
                 0,      100, 365, new BigDecimal("1799")),

            // ── Postpaid Plans (Airtel/Jio style) ─────────────────────────────

            plan("Postpaid Basic",   TelecomPlan.PlanType.Postpaid, new BigDecimal("30"),
                 300,    100, 30,  new BigDecimal("299")),

            plan("Postpaid Essential", TelecomPlan.PlanType.Postpaid, new BigDecimal("75"),
                 600,    100, 30,  new BigDecimal("449")),

            plan("Postpaid Prime",   TelecomPlan.PlanType.Postpaid, new BigDecimal("150"),
                 1200,   100, 30,  new BigDecimal("799")),

            plan("Postpaid Elite",   TelecomPlan.PlanType.Postpaid, new BigDecimal("300"),
                 0,      100, 30,  new BigDecimal("1199")),

            plan("Postpaid Ultra",   TelecomPlan.PlanType.Postpaid, new BigDecimal("500"),
                 0,      100, 30,  new BigDecimal("1999"))
        );

        planRepo.saveAll(plans);
        log.info("[TeleConnect Plan] Seeded {} plans with INR pricing.", plans.size());
    }

    private void seedAddOns() {
        log.info("[TeleConnect Plan] Seeding add-ons (INR pricing)...");

        List<AddOn> addOns = List.of(
            addOn("1 GB Data Top-up",    AddOn.AddOnType.DataTopup,   new BigDecimal("1"),    1,  new BigDecimal("19")),
            addOn("3 GB Data Top-up",    AddOn.AddOnType.DataTopup,   new BigDecimal("3"),    1,  new BigDecimal("51")),
            addOn("10 GB Data Pack",     AddOn.AddOnType.DataTopup,   new BigDecimal("10"),   28, new BigDecimal("151")),
            addOn("ISD Pack 50 Mins",    AddOn.AddOnType.ISDPack,     new BigDecimal("50"),   28, new BigDecimal("199")),
            addOn("ISD Pack 200 Mins",   AddOn.AddOnType.ISDPack,     new BigDecimal("200"),  28, new BigDecimal("599")),
            addOn("Roaming India Pack",  AddOn.AddOnType.RoamingPack, new BigDecimal("500"),  7,  new BigDecimal("99")),
            addOn("International Roam",  AddOn.AddOnType.RoamingPack, new BigDecimal("1000"), 30, new BigDecimal("999")),
            addOn("100 SMS Pack",        AddOn.AddOnType.SMSPack,     new BigDecimal("100"),  30, new BigDecimal("15")),
            addOn("500 SMS Pack",        AddOn.AddOnType.SMSPack,     new BigDecimal("500"),  30, new BigDecimal("49"))
        );

        addOnRepo.saveAll(addOns);
        log.info("[TeleConnect Plan] Seeded {} add-ons.", addOns.size());
    }

    private TelecomPlan plan(String name, TelecomPlan.PlanType type, BigDecimal dataGb,
                             int voiceMinutes, int smsCount, int validityDays, BigDecimal price) {
        TelecomPlan p = new TelecomPlan();
        p.setName(name);
        p.setType(type);
        p.setDataGb(dataGb);
        p.setVoiceMinutes(voiceMinutes);
        p.setSmsCount(smsCount);
        p.setValidityDays(validityDays);
        p.setPlanPrice(price);
        p.setStatus(TelecomPlan.PlanStatus.A);
        return p;
    }

    private AddOn addOn(String name, AddOn.AddOnType type, BigDecimal quota,
                        int validityDays, BigDecimal price) {
        AddOn a = new AddOn();
        a.setName(name);
        a.setType(type);
        a.setQuota(quota);
        a.setValidityDays(validityDays);
        a.setPrice(price);
        a.setStatus(AddOn.AddOnStatus.A);
        return a;
    }
}
